import crypto from "crypto";
import { AppDataSource } from "../../config/database";
import { NotFoundError, BadRequestError, ForbiddenError } from "routing-controllers";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { emailService } from "../../services/email.service";
import { Subscription } from "./subscription.entity";
import { FamilySubscriptionMember } from "./family-subscription-member.entity";
import { FamilySubscriptionInvite } from "./family-subscription-invite.entity";
import { Organization } from "./organization.entity";
import { usersRepository } from "../users/users.repository";

const subscriptionRepo = AppDataSource.getRepository(Subscription);
const memberRepo = AppDataSource.getRepository(FamilySubscriptionMember);
const inviteRepo = AppDataSource.getRepository(FamilySubscriptionInvite);
const orgRepo = AppDataSource.getRepository(Organization);

const FAMILY_SEAT_LIMIT = 6;
const INVITE_TTL_DAYS = 14;

function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildInviteUrls(token: string) {
  const appUrl = env.APP_URL.replace(/\/$/, "");
  const scheme = (env.MOBILE_APP_SCHEME || "mirafood").replace(/:\/\/$/, "");
  return {
    webUrl: `${appUrl}/signup?familyInvite=${encodeURIComponent(token)}`,
    deepLink: `${scheme}://family-invite?token=${encodeURIComponent(token)}`,
  };
}

async function expireStaleInvites(subscriptionId?: string) {
  const qb = inviteRepo
    .createQueryBuilder()
    .update(FamilySubscriptionInvite)
    .set({ status: "expired" })
    .where("status = :pending", { pending: "pending" })
    .andWhere("expires_at < NOW()");
  if (subscriptionId) {
    qb.andWhere("subscription_id = :subscriptionId", { subscriptionId });
  }
  await qb.execute();
}

export const familySubscriptionService = {
  async getFamilySubscription(userId: string) {
    await expireStaleInvites();
    const owned = await subscriptionRepo.findOne({
      where: { userId, subscriptionType: "family" },
      order: { createdAt: "DESC" },
    });
    if (!owned) {
      const membership = await memberRepo.findOne({ where: { userId } });
      if (!membership) return null;
      const subscription = await subscriptionRepo.findOne({ where: { id: membership.subscriptionId } });
      if (!subscription) return null;
      return this.packSubscription(subscription, userId);
    }
    return this.packSubscription(owned, userId);
  },

  async packSubscription(subscription: Subscription, viewerUserId?: string) {
    const members = await memberRepo.find({ where: { subscriptionId: subscription.id } });
    const users = await Promise.all(
      members.map(async (member) => {
        const user = await usersRepository.findById(member.userId);
        return user
          ? { userId: user.id, displayName: user.displayName, email: user.email, role: member.role }
          : null;
      }),
    );

    const isPayer = viewerUserId ? subscription.userId === viewerUserId : true;
    let pendingInvites: Array<{
      id: string;
      email: string;
      status: string;
      expiresAt: string;
      createdAt: string;
    }> = [];

    if (isPayer) {
      await expireStaleInvites(subscription.id);
      const invites = await inviteRepo.find({
        where: { subscriptionId: subscription.id, status: "pending" },
        order: { createdAt: "DESC" },
      });
      pendingInvites = invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expiresAt.toISOString(),
        createdAt: invite.createdAt.toISOString(),
      }));
    }

    return {
      id: subscription.id,
      planCode: subscription.planCode,
      status: subscription.status,
      subscriptionType: subscription.subscriptionType,
      renewsOn: subscription.renewsOn,
      members: users.filter(Boolean),
      pendingInvites,
      seatLimit: FAMILY_SEAT_LIMIT,
    };
  },

  async createFamilyPlan(_userId: string, _planCode = "family_monthly") {
    throw new BadRequestError(
      "Family plans activate after successful checkout payment. Use POST /payments/checkout with planCode family_monthly.",
    );
  },

  async ensurePayerMembership(subscriptionId: string, userId: string) {
    const existing = await memberRepo.findOne({ where: { subscriptionId, userId } });
    if (!existing) {
      await memberRepo.save(memberRepo.create({ subscriptionId, userId, role: "payer" }));
    }
  },

  async occupiedSeats(subscriptionId: string) {
    await expireStaleInvites(subscriptionId);
    const members = await memberRepo.count({ where: { subscriptionId } });
    const pending = await inviteRepo.count({ where: { subscriptionId, status: "pending" } });
    return members + pending;
  },

  async addFamilyMember(payerUserId: string, memberEmail: string) {
    const email = memberEmail.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      throw new BadRequestError("Enter a valid email address");
    }

    const subscription = await subscriptionRepo.findOne({
      where: { userId: payerUserId, subscriptionType: "family", status: "active" },
    });
    if (!subscription) throw new BadRequestError("No active family subscription");

    const payer = await usersRepository.findById(payerUserId);
    if (!payer) throw new NotFoundError("Payer not found");

    if (email === payer.email.toLowerCase()) {
      throw new BadRequestError("Cannot add yourself as a member");
    }

    const existingMemberUser = await usersRepository.findByEmail(email);
    if (existingMemberUser) {
      const alreadyOnThis = await memberRepo.findOne({
        where: { subscriptionId: subscription.id, userId: existingMemberUser.id },
      });
      if (alreadyOnThis) {
        throw new BadRequestError("That person is already on your family plan");
      }
      const otherFamily = await memberRepo.findOne({ where: { userId: existingMemberUser.id } });
      if (otherFamily && otherFamily.subscriptionId !== subscription.id) {
        throw new BadRequestError("That account is already on another family plan");
      }
    }

    const pendingSameEmail = await inviteRepo.findOne({
      where: { subscriptionId: subscription.id, email, status: "pending" },
    });
    if (pendingSameEmail) {
      throw new BadRequestError("An invite is already pending for that email");
    }

    const seats = await this.occupiedSeats(subscription.id);
    if (seats >= FAMILY_SEAT_LIMIT) {
      throw new BadRequestError(`Family plan supports up to ${FAMILY_SEAT_LIMIT} members`);
    }

    if (existingMemberUser) {
      await memberRepo.save(
        memberRepo.create({
          subscriptionId: subscription.id,
          userId: existingMemberUser.id,
          role: "member",
        }),
      );

      try {
        await emailService.sendFamilyMemberAddedEmail(existingMemberUser.email, {
          displayName: existingMemberUser.displayName,
          inviterName: payer.displayName,
        });
      } catch (err) {
        logger.warn({ err, email }, "Failed to send family member added email");
      }

      return {
        ...(await this.packSubscription(subscription, payerUserId)),
        action: "added" as const,
      };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const invite = await inviteRepo.save(
      inviteRepo.create({
        subscriptionId: subscription.id,
        inviterUserId: payerUserId,
        email,
        tokenHash: hashInviteToken(rawToken),
        status: "pending",
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        acceptedAt: null,
        acceptedUserId: null,
      }),
    );

    const { webUrl, deepLink } = buildInviteUrls(rawToken);
    try {
      await emailService.sendFamilyInviteEmail(email, {
        inviterName: payer.displayName,
        webUrl,
        deepLink,
        expiresAt: invite.expiresAt,
      });
    } catch (err) {
      await inviteRepo.delete({ id: invite.id });
      logger.error({ err, email }, "Failed to send family invite email");
      throw new BadRequestError("Could not send the invite email. Try again later.");
    }

    return {
      ...(await this.packSubscription(subscription, payerUserId)),
      action: "invited" as const,
    };
  },

  async resendInvite(payerUserId: string, inviteId: string) {
    const subscription = await subscriptionRepo.findOne({
      where: { userId: payerUserId, subscriptionType: "family", status: "active" },
    });
    if (!subscription) throw new BadRequestError("No active family subscription");

    const invite = await inviteRepo.findOne({
      where: { id: inviteId, subscriptionId: subscription.id },
    });
    if (!invite) throw new NotFoundError("Invite not found");
    if (invite.status !== "pending") throw new BadRequestError("Only pending invites can be resent");
    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = "expired";
      await inviteRepo.save(invite);
      throw new BadRequestError("This invite has expired. Send a new one.");
    }

    const payer = await usersRepository.findById(payerUserId);
    if (!payer) throw new NotFoundError("Payer not found");

    const rawToken = crypto.randomBytes(32).toString("hex");
    invite.tokenHash = hashInviteToken(rawToken);
    invite.expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    await inviteRepo.save(invite);

    const { webUrl, deepLink } = buildInviteUrls(rawToken);
    await emailService.sendFamilyInviteEmail(invite.email, {
      inviterName: payer.displayName,
      webUrl,
      deepLink,
      expiresAt: invite.expiresAt,
    });

    return this.packSubscription(subscription, payerUserId);
  },

  async revokeInvite(payerUserId: string, inviteId: string) {
    const subscription = await subscriptionRepo.findOne({
      where: { userId: payerUserId, subscriptionType: "family", status: "active" },
    });
    if (!subscription) throw new BadRequestError("No active family subscription");

    const invite = await inviteRepo.findOne({
      where: { id: inviteId, subscriptionId: subscription.id },
    });
    if (!invite) throw new NotFoundError("Invite not found");
    if (invite.status !== "pending") throw new BadRequestError("Invite is no longer pending");

    invite.status = "revoked";
    await inviteRepo.save(invite);
    return this.packSubscription(subscription, payerUserId);
  },

  async acceptInviteByToken(userId: string, token: string) {
    const trimmed = token.trim();
    if (!trimmed) throw new BadRequestError("Invite token is required");

    await expireStaleInvites();
    const invite = await inviteRepo.findOne({
      where: { tokenHash: hashInviteToken(trimmed), status: "pending" },
    });
    if (!invite) throw new NotFoundError("Invite not found or already used");
    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = "expired";
      await inviteRepo.save(invite);
      throw new BadRequestError("This invite has expired");
    }

    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenError("Sign in with the invited email address to join this family plan");
    }

    await this.attachUserToInvite(user.id, invite);
    const subscription = await subscriptionRepo.findOne({ where: { id: invite.subscriptionId } });
    if (!subscription) throw new NotFoundError("Family subscription not found");
    return this.packSubscription(subscription, userId);
  },

  async acceptPendingInvitesForUser(userId: string, email?: string | null) {
    const user = await usersRepository.findById(userId);
    if (!user) return { accepted: 0 };
    const targetEmail = (email || user.email).toLowerCase().trim();
    if (!targetEmail) return { accepted: 0 };

    await expireStaleInvites();
    const invites = await inviteRepo.find({
      where: { email: targetEmail, status: "pending" },
      order: { createdAt: "ASC" },
    });

    let accepted = 0;
    for (const invite of invites) {
      if (invite.expiresAt.getTime() < Date.now()) {
        invite.status = "expired";
        await inviteRepo.save(invite);
        continue;
      }
      try {
        await this.attachUserToInvite(user.id, invite);
        accepted += 1;
      } catch (err) {
        logger.warn({ err, inviteId: invite.id, userId }, "Failed to auto-accept family invite");
      }
    }
    return { accepted };
  },

  async attachUserToInvite(userId: string, invite: FamilySubscriptionInvite) {
    const subscription = await subscriptionRepo.findOne({
      where: { id: invite.subscriptionId, subscriptionType: "family", status: "active" },
    });
    if (!subscription) {
      invite.status = "expired";
      await inviteRepo.save(invite);
      throw new BadRequestError("Family subscription is no longer active");
    }

    if (subscription.userId === userId) {
      invite.status = "accepted";
      invite.acceptedAt = new Date();
      invite.acceptedUserId = userId;
      await inviteRepo.save(invite);
      return;
    }

    const existingMembership = await memberRepo.findOne({ where: { userId } });
    if (existingMembership && existingMembership.subscriptionId !== subscription.id) {
      throw new BadRequestError("You are already on another family plan");
    }

    if (!existingMembership) {
      const seats = await memberRepo.count({ where: { subscriptionId: subscription.id } });
      if (seats >= FAMILY_SEAT_LIMIT) {
        throw new BadRequestError("This family plan is full");
      }
      await memberRepo.save(
        memberRepo.create({
          subscriptionId: subscription.id,
          userId,
          role: "member",
        }),
      );
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedUserId = userId;
    await inviteRepo.save(invite);

    // Revoke other pending invites for the same email on this subscription.
    await inviteRepo
      .createQueryBuilder()
      .update(FamilySubscriptionInvite)
      .set({ status: "revoked" })
      .where("subscription_id = :subscriptionId", { subscriptionId: subscription.id })
      .andWhere("email = :email", { email: invite.email })
      .andWhere("status = :pending", { pending: "pending" })
      .andWhere("id <> :id", { id: invite.id })
      .execute();
  },

  async createOrganization(name: string) {
    const org = orgRepo.create({ name: name.trim() });
    await orgRepo.save(org);
    return org;
  },

  async getOrganization(id: string) {
    return orgRepo.findOne({ where: { id } });
  },
};
