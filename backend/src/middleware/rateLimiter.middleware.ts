import rateLimit from "express-rate-limit";

/**
 * Anti-Brute-Force Rate Limiter for Answer Verification
 * Allows up to 45 validation attempts per minute per IP.
 */
export const validationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 45, // max 45 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "TOO MANY TRANSMISSION ATTEMPTS · SYSTEM COOLDOWN ACTIVE",
  },
});

/**
 * Login Rate Limiter for Authentication Protection
 * Limits authentication attempts to 15 per minute per IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "TOO_MANY_LOGIN_ATTEMPTS",
    message: "Too many login attempts. Please wait 60 seconds before trying again.",
  },
});
