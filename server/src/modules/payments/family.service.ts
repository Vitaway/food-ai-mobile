import { AppDataSource } from "../../config/database";
import { NotFoundError, BadRequestError, ForbiddenError } from "routing-controllers";
import { Subscription } from "./subscription.entity";
import { FamilySubscriptionMember } from "./family-subscription-member.entity";
import { Organization } from "./organization.entity";
import { usersRepository } from "../users/users.repository";

const subscriptionRepo = AppDataSource.getRepository(Subscription);
const memberRepo = AppDataSource.getRepository(FamilySubscriptionMember);
const orgRepo = AppDataSource.getRepository(Organization);

export const familySubscriptionService = {
  async getFamilySubscription(userId: string) {
    const owned = await subscriptionRepo.findOne({
      where: { userId, subscriptionType: "family" },
      order: { createdAt: "DESC" },
    });
    if (!owned) {
      const membership = await memberRepo.findOne({ where: { userId } });
      if (!membership) return null;
      const subscription = await subscriptionRepo.findOne({ where: { id: membership.subscriptionId } });
      if (!subscription) return null;
      return this.packSubscription(subscription);
    }
    return this.packSubscription(owned);
  },

  async packSubscription(subscription: Subscription) {
    const members = await memberRepo.find({ where: { subscriptionId: subscription.id } });
    const users = await Promise.all(
      members.map(async (member) => {
        const user = await usersRepository.findById(member.userId);
        return user
          ? { userId: user.id, displayName: user.displayName, email: user.email, role: member.role }
          : null;
      }),
    );
    return {
      id: subscription.id,
      planCode: subscription.planCode,
      status: subscription.status,
      subscriptionType: subscription.subscriptionType,
      renewsOn: subscription.renewsOn,
      members: users.filter(Boolean),
    };
  },

  async createFamilyPlan(userId: string, planCode = "family_monthly") {
    let subscription = await subscriptionRepo.findOne({
      where: { userId, subscriptionType: "family" },
      order: { createdAt: "DESC" },
    });
    if (!subscription) {
      subscription = subscriptionRepo.create({
        userId,
        organizationId: null,
        planCode,
        subscriptionType: "family",
        status: "active",
        renewsOn: null,
        trialEndsOn: null,
        metadata: { source: "manual_activation" },
      });
      await subscriptionRepo.save(subscription);
    }
    const existing = await memberRepo.findOne({ where: { subscriptionId: subscription.id, userId } });
    if (!existing) {
      await memberRepo.save(
        memberRepo.create({ subscriptionId: subscription.id, userId, role: "payer" }),
      );
    }
    return this.packSubscription(subscription);
  },

  async addFamilyMember(payerUserId: string, memberEmail: string) {
    const subscription = await subscriptionRepo.findOne({
      where: { userId: payerUserId, subscriptionType: "family", status: "active" },
    });
    if (!subscription) throw new BadRequestError("No active family subscription");

    const member = await usersRepository.findByEmail(memberEmail.toLowerCase().trim());
    if (!member) throw new NotFoundError("User not found with that email");
    if (member.id === payerUserId) throw new BadRequestError("Cannot add yourself as a member");

    const count = await memberRepo.count({ where: { subscriptionId: subscription.id } });
    if (count >= 6) throw new BadRequestError("Family plan supports up to 6 members");

    await memberRepo.save(
      memberRepo.create({
        subscriptionId: subscription.id,
        userId: member.id,
        role: "member",
      }),
    );
    return this.packSubscription(subscription);
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
