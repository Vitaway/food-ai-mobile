import { getApiAuthToken } from '@/lib/apiClient';
import { API_BASE_URL } from '@/constants/api';
import type { MealAnalysisService } from '@/services/contracts/mealAnalysisService';
import type { MealAnalysisPreview } from '@/types';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function normalizeAnalysis(data: Record<string, unknown>): MealAnalysisPreview {
  return data as unknown as MealAnalysisPreview;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & Record<string, unknown>;
  if (!response.ok || body.success === false) {
    const message =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.message === 'string' && body.message) ||
      `Meal analysis failed (${response.status})`;
    throw new Error(message);
  }
  if (body.success === true && body.data !== undefined) {
    return body.data;
  }
  return body as T;
}

export const apiMealAnalysisService: MealAnalysisService = {
  async analyzeMeal({ imageUri, text, plateDiameterCm }) {
    if (!API_BASE_URL) {
      throw new Error('API is not configured');
    }

    const token = getApiAuthToken();
    if (!token) {
      throw new Error('Sign in to analyze meals with AI');
    }

    if (text?.trim()) {
      const response = await fetch(`${API_BASE_URL}/api/v1/vision/meals/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: text.trim(),
          plateDiameterCm: plateDiameterCm ?? null,
        }),
      });
      const data = await parseApiResponse<Record<string, unknown>>(response);
      return normalizeAnalysis(data);
    }

    if (!imageUri) {
      throw new Error('Add a photo or describe your meal');
    }

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'meal.jpg',
    } as unknown as Blob);

    if (plateDiameterCm != null) {
      formData.append('plateDiameterCm', String(plateDiameterCm));
    }

    formData.append('metadata', JSON.stringify({ source: 'mobile' }));

    const response = await fetch(`${API_BASE_URL}/api/v1/vision/meals/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await parseApiResponse<Record<string, unknown>>(response);
    return normalizeAnalysis(data);
  },
};
