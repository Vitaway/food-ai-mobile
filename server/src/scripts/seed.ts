import "reflect-metadata";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { env, isProduction } from "../config/env";
import { logger } from "../config/logger";
import type { UserRole } from "../middlewares/auth.middleware";
import { usersRepository } from "../modules/users/users.repository";
import { coachProfilesRepository } from "../modules/coaches/coach-profiles.repository";
import { ensureConsumerProfileForUser } from "../modules/consumers/ensure-consumer-profile.util";
import { Organization } from "../modules/payments/organization.entity";
import type { User } from "../modules/users/user.entity";

async function upsertSeedUser(opts: {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  organizationId?: string | null;
}) {
  const email = opts.email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(opts.password, 10);
  let user = await usersRepository.findByEmail(email);

  if (!user) {
    user = usersRepository.create({
      email,
      passwordHash,
      role: opts.role,
      displayName: opts.displayName,
      avatarUrl: null,
      isActive: true,
      organizationId: opts.organizationId ?? null,
      // Marks account as pre-verified — staff MFA / email OTP is skipped on login.
      registrationSource: "seed",
    });
    await usersRepository.save(user);
    logger.info({ email, role: opts.role }, "Created seed user (OTP skipped)");
    return user;
  }

  user.passwordHash = passwordHash;
  user.role = opts.role;
  user.isActive = true;
  user.displayName = opts.displayName;
  user.registrationSource = "seed";
  if (opts.organizationId !== undefined) {
    user.organizationId = opts.organizationId;
  }
  await usersRepository.save(user);
  logger.info({ email, role: opts.role }, "Updated seed user (OTP skipped)");
  return user;
}

async function ensureSeedOrganization(name: string) {
  const repo = AppDataSource.getRepository(Organization);
  const existing = await repo
    .createQueryBuilder("o")
    .where("LOWER(o.name) = LOWER(:name)", { name })
    .getOne();
  if (existing) {
    existing.status = "active";
    if (!existing.contactEmail) existing.contactEmail = env.SEED_ORG_ADMIN_EMAIL;
    await repo.save(existing);
    return existing;
  }

  const org = repo.create({
    name,
    status: "active",
    contactEmail: env.SEED_ORG_ADMIN_EMAIL,
    contactPhone: null,
    notes: "Seed organization for local/dev demos",
  });
  await repo.save(org);
  logger.info({ name: org.name, id: org.id }, "Created seed organization");
  return org;
}

async function attachToOrganization(user: User, organizationId: string) {
  if (user.organizationId === organizationId) return user;
  user.organizationId = organizationId;
  await usersRepository.save(user);
  return user;
}

async function ensureCoachProfile(
  userId: string,
  opts: { title: string; organization: string; bio?: string | null },
) {
  const existingProfile = await coachProfilesRepository.findByUserId(userId);
  if (existingProfile) {
    existingProfile.title = opts.title;
    existingProfile.organization = opts.organization;
    if (opts.bio !== undefined) existingProfile.bio = opts.bio;
    await coachProfilesRepository.save(existingProfile);
    return existingProfile;
  }

  const profile = coachProfilesRepository.create({
    userId,
    title: opts.title,
    organization: opts.organization,
    bio: opts.bio ?? null,
    timezone: "Africa/Kigali",
  });
  await coachProfilesRepository.save(profile);
  logger.info({ userId }, "Created coach profile");
  return profile;
}

async function clearOperationalDemoData() {
  await AppDataSource.query(`DELETE FROM meal_submissions`);
  await AppDataSource.query(`DELETE FROM consumer_profiles`);
  logger.warn("Wiped meal submissions and consumer profiles (--wipe-demo)");
}

async function seed() {
  const usersOnly = process.argv.includes("--users-only");
  const wipeDemo = process.argv.includes("--wipe-demo");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.runMigrations();

  if (wipeDemo) {
    if (isProduction) {
      logger.error("Refusing --wipe-demo in production. Aborting.");
      process.exit(1);
    }
    await clearOperationalDemoData();
  } else if (!usersOnly) {
    logger.info(
      "Keeping existing meals and consumer profiles (pass --wipe-demo only on local/dev to clear them)",
    );
  } else {
    logger.info("Users-only seed — keeping meals and consumer profiles");
  }

  const org = await ensureSeedOrganization("Vitaway");

  const coach = await upsertSeedUser({
    email: env.SEED_COACH_EMAIL,
    password: env.SEED_COACH_PASSWORD,
    role: "coach",
    displayName: "Coach Vitaway",
    organizationId: org.id,
  });
  await ensureCoachProfile(coach.id, {
    title: "Nutrition Coach",
    organization: org.name,
  });

  await upsertSeedUser({
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
    role: "admin",
    displayName: "Platform Admin",
  });

  const consumer = await upsertSeedUser({
    email: env.SEED_CONSUMER_EMAIL,
    password: env.SEED_CONSUMER_PASSWORD,
    role: "consumer",
    displayName: "Demo Patient",
    organizationId: org.id,
  });
  await ensureConsumerProfileForUser(consumer.id);
  logger.info({ email: consumer.email }, "Ensured consumer profile");

  const nutritionCoach = await upsertSeedUser({
    email: env.SEED_NUTRITION_COACH_EMAIL,
    password: env.SEED_NUTRITION_COACH_PASSWORD,
    role: "nutrition_coach",
    displayName: "Nutrition Coach",
    organizationId: org.id,
  });
  await ensureCoachProfile(nutritionCoach.id, {
    title: "Clinical Nutrition Coach",
    organization: org.name,
  });

  const orgAdmin = await upsertSeedUser({
    email: env.SEED_ORG_ADMIN_EMAIL,
    password: env.SEED_ORG_ADMIN_PASSWORD,
    role: "organization_admin",
    displayName: "Organization Admin",
    organizationId: org.id,
  });
  await attachToOrganization(orgAdmin, org.id);
  await ensureConsumerProfileForUser(orgAdmin.id);
  logger.info(
    { email: orgAdmin.email, organizationId: org.id },
    "Linked organization admin to Vitaway",
  );

  await upsertSeedUser({
    email: env.SEED_DATA_ENTRY_EMAIL,
    password: env.SEED_DATA_ENTRY_PASSWORD,
    role: "data_entry_staff",
    displayName: "Data Entry Staff",
  });

  const { seedNutritionFoods } = await import("../modules/nutrition-db/nutrition-seed.util");
  await seedNutritionFoods();

  logger.info(
    {
      organization: { id: org.id, name: org.name },
      accounts: [
        { role: "admin", email: env.SEED_ADMIN_EMAIL, mfa: "skipped (seed)" },
        { role: "coach", email: env.SEED_COACH_EMAIL, mfa: "skipped (seed)", organization: org.name },
        { role: "consumer", email: env.SEED_CONSUMER_EMAIL, organization: org.name },
        {
          role: "nutrition_coach",
          email: env.SEED_NUTRITION_COACH_EMAIL,
          mfa: "skipped (seed)",
          organization: org.name,
        },
        {
          role: "organization_admin",
          email: env.SEED_ORG_ADMIN_EMAIL,
          mfa: "skipped (seed)",
          organization: org.name,
        },
        { role: "data_entry_staff", email: env.SEED_DATA_ENTRY_EMAIL, mfa: "skipped (seed)" },
      ],
    },
    "Seed users ready (default password Test@123 unless overridden in env). Staff seed logins skip email OTP.",
  );

  await AppDataSource.destroy();
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
