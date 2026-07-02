import type { PlateDetectionService } from '@/services/contracts/plateDetectionService';

/** Fallback when EXPO_PUBLIC_PLATE_API_URL is not set — always prompts to configure the API. */
export const mockPlateDetectionService: PlateDetectionService = {
  async detectPlate() {
    throw new Error(
      'Plate detection API is not configured. Set EXPO_PUBLIC_API_URL to your MiraFood API origin.',
    );
  },
};
