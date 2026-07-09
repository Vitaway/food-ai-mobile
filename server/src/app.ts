import "reflect-metadata";
import path from "path";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { useExpressServer } from "routing-controllers";
import type { ValidatorOptions } from "class-validator";
import { env } from "./config/env";
import { controllers } from "./modules";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { ErrorHandler } from "./middlewares/error.handler";
import {
  createAuthorizationChecker,
  createCurrentUserChecker,
} from "./middlewares/auth.middleware";
import { authLoginRateLimit, authRegisterRateLimit, visionDetectRateLimit } from "./middlewares/rate-limit.middleware";
import { errorResponse } from "./utils/response";
import legacyRoutes from "./routes/legacy.routes";

const app = express();

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.replace(/\/$/, "");
  return env.CORS_ORIGIN.some((allowed) => allowed.replace(/\/$/, "") === normalized);
}

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    if (
      env.NODE_ENV !== "production" &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

const uploadsRoot = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsRoot, { maxAge: "7d", fallthrough: false }));

app.use("/api/v1/auth/login", authLoginRateLimit);
app.use("/api/v1/auth/register", authRegisterRateLimit);
app.use("/api/v1/vision/plates/detect", visionDetectRateLimit);
app.use("/api/v1/vision/meals/analyze", visionDetectRateLimit);
app.use("/api/v1/vision/meals/analyze-text", visionDetectRateLimit);

// Legacy Flask mobile/backend paths (GET /health, POST /plates/detect at domain root)
app.use(legacyRoutes);

const validationOptions: ValidatorOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
};

useExpressServer(app, {
  routePrefix: "/api/v1",
  controllers: Object.values(controllers) as never[],
  validation: validationOptions,
  classTransformer: true,
  authorizationChecker: createAuthorizationChecker(),
  currentUserChecker: createCurrentUserChecker(),
  defaultErrorHandler: false,
  middlewares: [ErrorHandler],
  interceptors: [ResponseInterceptor],
});

app.use((_req: Request, res: Response) => {
  if (!res.headersSent) {
    res.status(404).json(errorResponse("Route not found"));
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  const statusCode = err?.httpCode ?? err?.status ?? 500;
  const message = err?.message ?? "Internal Server Error";
  res.status(statusCode).json(errorResponse(message));
});

export default app;
