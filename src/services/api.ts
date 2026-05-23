import { API_BASE_URL } from '@/constants/site';

type ApiError = {
  message: string;
  status: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw { message: 'API base URL is not configured', status: 0 } satisfies ApiError;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw { message: response.statusText, status: response.status } satisfies ApiError;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getDashboard: () => request('/api/user/dashboard'),
  submitMeal: (body: FormData) =>
    fetch(`${API_BASE_URL}/api/meals/submit`, { method: 'POST', body }),
};
