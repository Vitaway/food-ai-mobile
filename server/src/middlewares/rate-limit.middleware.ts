import rateLimit from "express-rate-limit";

export const authLoginRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Try again later." },
});

export const authRegisterRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many registration attempts. Try again later." },
});

export const authAdminLoginRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many admin login attempts. Try again later." },
});

export const visionDetectRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many vision requests. Try again later." },
});

export const authForgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many password reset requests. Try again in a few minutes.",
  },
});

export const authResetPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many password reset attempts. Try again in a few minutes.",
  },
});
