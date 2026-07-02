import "reflect-metadata";
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

const app = express();

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (env.CORS_ORIGIN.includes(origin)) {
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
    callback(new Error("Not allowed by CORS"));
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

app.use("/api/v1/auth/login", authLoginRateLimit);
app.use("/api/v1/auth/register", authRegisterRateLimit);
app.use("/api/v1/vision/plates/detect", visionDetectRateLimit);
app.use("/api/v1/vision/meals/analyze", visionDetectRateLimit);
app.use("/api/v1/vision/meals/analyze-text", visionDetectRateLimit);

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
