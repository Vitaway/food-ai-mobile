import type { ImageCaptureMetadata } from '@/utils/imageCaptureMetadata';

export type PlateContainerType = 'plate' | 'bowl';

export type PlateDetectionResult = {
  detected: boolean;
  containerType: PlateContainerType | null;
  diameterCm: number | null;
  confidence: number | null;
  message?: string | null;
};

export type PlateDetectionInput = {
  imageUri: string;
  metadata: ImageCaptureMetadata;
};

export interface PlateDetectionService {
  detectPlate: (input: PlateDetectionInput) => Promise<PlateDetectionResult>;
}
