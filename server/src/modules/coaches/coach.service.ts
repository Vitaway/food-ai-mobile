import type { Request } from "express";
import { NotFoundError } from "routing-controllers";
import { saveConsumerAvatar } from "../../services/uploads.service";
import { usersRepository } from "../users/users.repository";
import { coachProfilesRepository } from "./coach-profiles.repository";
import type { UpdateCoachProfileDto } from "./coach.dto";

export const coachService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const profile = await coachProfilesRepository.findByUserId(userId);
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        memberSince: user.createdAt.toISOString(),
      },
      profile: profile
        ? {
            id: profile.id,
            title: profile.title,
            organization: profile.organization,
            bio: profile.bio,
            phone: profile.phone,
            timezone: profile.timezone,
          }
        : null,
    };
  },

  async updateProfile(userId: string, dto: UpdateCoachProfileDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    if (dto.displayName != null) user.displayName = dto.displayName.trim();
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl || null;
    await usersRepository.save(user);

    let profile = await coachProfilesRepository.findByUserId(userId);
    if (!profile) {
      profile = coachProfilesRepository.create({ userId });
    }
    if (dto.title !== undefined) profile.title = dto.title || null;
    if (dto.organization !== undefined) profile.organization = dto.organization || null;
    if (dto.bio !== undefined) profile.bio = dto.bio || null;
    if (dto.phone !== undefined) profile.phone = dto.phone || null;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone || null;
    await coachProfilesRepository.save(profile);

    return this.getProfile(userId);
  },

  async uploadAvatar(
    userId: string,
    buffer: Buffer,
    mimeType: string,
    req?: Request,
  ) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const { avatarUrl } = saveConsumerAvatar(buffer, mimeType, userId, req);
    user.avatarUrl = avatarUrl;
    await usersRepository.save(user);

    return this.getProfile(userId);
  },
};
