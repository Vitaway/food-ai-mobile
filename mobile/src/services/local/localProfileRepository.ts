import type { ProfileRepository } from '@/services/contracts/profileRepository';
import { getStoredProfile, saveProfile } from '@/services/local/storage';

export const localProfileRepository: ProfileRepository = {
  getProfile: getStoredProfile,
  saveProfile,
};
