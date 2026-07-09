import "reflect-metadata";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { usersRepository } from "../modules/users/users.repository";
import { coachProfilesRepository } from "../modules/coaches/coach-profiles.repository";

async function upsertSeedUser(opts: {
  email: string;
  password: string;
  role: "coach" | "admin";
  displayName: string;
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
    });
    await usersRepository.save(user);
    logger.info({ email, role: opts.role }, "Created seed user");
    return user;
  }

  user.passwordHash = passwordHash;
  user.isActive = true;
  user.displayName = opts.displayName;
  await usersRepository.save(user);
  logger.info({ email, role: opts.role }, "Updated seed user");
  return user;
}

async function clearOperationalDemoData() {
  await AppDataSource.query(`DELETE FROM meal_submissions`);
  await AppDataSource.query(`DELETE FROM consumer_profiles`);
  logger.info("Cleared meal submissions and consumer profiles");
}

async function seed() {
  const usersOnly = process.argv.includes("--users-only");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.runMigrations();

  if (usersOnly) {
    logger.info("Users-only seed — keeping meals and consumer profiles");
  } else {
    await clearOperationalDemoData();
  }

  const coach = await upsertSeedUser({
    email: env.SEED_COACH_EMAIL,
    password: env.SEED_COACH_PASSWORD,
    role: "coach",
    displayName: "Coach Vitaway",
  });

  const existingProfile = await coachProfilesRepository.findByUserId(coach.id);
  if (!existingProfile) {
    const profile = coachProfilesRepository.create({
      userId: coach.id,
      title: "Nutrition Coach",
      organization: "Vitaway",
      bio: null,
      timezone: "Africa/Kigali",
    });
    await coachProfilesRepository.save(profile);
    logger.info("Created coach profile");
  }

  await upsertSeedUser({
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
    role: "admin",
    displayName: "Platform Admin",
  });

  const { seedNutritionFoods } = await import("../modules/nutrition-db/nutrition-seed.util");
  await seedNutritionFoods();

  await AppDataSource.destroy();
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
