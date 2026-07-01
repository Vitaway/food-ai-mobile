export function errorResponse(
  message: string,
  meta?: Record<string, unknown>,
): { success: false; error: string; meta?: Record<string, unknown> } {
  return { success: false, error: message, ...(meta && { meta }) };
}

export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): { success: true; data: T; meta?: Record<string, unknown> } {
  return { success: true, data, ...(meta && { meta }) };
}
