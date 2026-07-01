import type { Request, Response, NextFunction } from "express";
import { Middleware, ExpressErrorMiddlewareInterface } from "routing-controllers";
import { logger } from "../config/logger";
import { errorResponse } from "../utils/response";

@Middleware({ type: "after" })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
  error(err: any, _req: Request, res: Response, _next: NextFunction): void {
    if (res.headersSent) return;
    const statusCode = err?.httpCode ?? err?.status ?? 500;
    const message =
      err?.errors && Array.isArray(err.errors)
        ? (err.errors
            .map((e: any) => {
              const first =
                e?.constraints && typeof e.constraints === "object"
                  ? (Object.values(e.constraints)[0] as string)
                  : e?.message;
              if (!first) return null;
              const prop =
                typeof e?.property === "string" && e.property
                  ? `${e.property}: `
                  : "";
              return `${prop}${first}`;
            })
            .filter(Boolean)
            .join("; ") as string) || err?.message
        : (err?.message ?? "Internal Server Error");

    if (statusCode >= 500) {
      logger.error({ stack: err?.stack }, `Unhandled error: ${message}`);
    }

    res.setHeader("Content-Type", "application/json");
    res.status(statusCode).json(errorResponse(message));
  }
}
