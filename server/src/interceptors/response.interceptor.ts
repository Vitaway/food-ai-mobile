import type { Action } from "routing-controllers";
import { Interceptor, type InterceptorInterface } from "routing-controllers";
import type { Response } from "express";
import { successResponse } from "../utils/response";

function isExpressResponse(value: unknown): value is Response {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as Response).setHeader === "function" &&
    typeof (value as Response).end === "function"
  );
}

function isNodeStreamLike(value: unknown): boolean {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as { pipe?: unknown }).pipe === "function"
  );
}

@Interceptor()
export class ResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, result: unknown): unknown {
    if (action.response?.headersSent) {
      return result;
    }
    if (isExpressResponse(result)) {
      return result;
    }
    if (result != null && typeof result === "object" && "success" in result) {
      return result;
    }
    if (isNodeStreamLike(result)) {
      return result;
    }
    return successResponse(result);
  }
}
