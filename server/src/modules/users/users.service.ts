import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { usersRepository } from "./users.repository";
import type { User } from "./user.entity";

export const usersService = {
  async listForMessaging(viewer: User) {
    const users = await usersRepository.findAllActive();
    const consumers = await consumerProfilesRepository.findAll();
    const clientIdByUserId = new Map(
      consumers.filter((c) => c.userId).map((c) => [c.userId!, c.id]),
    );

    return users
      .filter((u) => u.id !== viewer.id)
      .map((u) => ({
        userId: u.id,
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        clientId: clientIdByUserId.get(u.id) ?? null,
      }));
  },
};
