import { API_BASE_URL } from '@/constants/api';
import type {
  PlateDetectionInput,
  PlateDetectionResult,
  PlateDetectionService,
} from '@/services/contracts/plateDetectionService';
import { prepareImageForUpload } from '@/utils/prepareUploadImage';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function normalizeResult(body: Record<string, unknown>): PlateDetectionResult {
  const detected = Boolean(body.detected);
  const containerRaw = body.containerType;
  const containerType =
    containerRaw === 'plate' || containerRaw === 'bowl' ? containerRaw : null;

  const diameterRaw = body.diameterCm;
  const diameterCm =
    detected && typeof diameterRaw === 'number' && Number.isFinite(diameterRaw)
      ? diameterRaw
      : null;

  const confidenceRaw = body.confidence;
  const confidence =
    detected && typeof confidenceRaw === 'number' && Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : null;

  const message = typeof body.message === 'string' ? body.message : null;

  return {
    detected: detected && containerType != null && diameterCm != null,
    containerType: detected ? containerType : null,
    diameterCm: detected ? diameterCm : null,
    confidence: detected ? confidence : null,
    message,
  };
}

export const apiPlateDetectionService: PlateDetectionService = {
  async detectPlate({ imageUri, metadata }) {
    const upload = await prepareImageForUpload(imageUri);
    const formData = new FormData();

    formData.append('image', {
      uri: upload.uri,
      type: upload.mimeType,
      name: upload.name,
    } as unknown as Blob);

    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${API_BASE_URL}/api/v1/vision/plates/detect`, {
      method: 'POST',
      body: formData,
    });

    const body = (await response.json().catch(() => ({}))) as ApiEnvelope<
      Record<string, unknown>
    >;

    if (!response.ok || !body.success) {
      const detail =
        response.status === 413
          ? 'Photo is too large for the server. Try again — the app will compress it automatically.'
          : (typeof body.error === 'string' && body.error) || `HTTP ${response.status}`;
      throw new Error(detail);
    }

    return normalizeResult(body.data ?? {});
  },
};
