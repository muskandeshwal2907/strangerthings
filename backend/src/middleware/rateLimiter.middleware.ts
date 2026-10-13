import rateLimit from "express-rate-limit";

/**
 * Anti-Brute-Force Rate Limiter for Answer Verification
 * Scaled for multi-team tournaments where 50+ squads share a single venue NAT IP.
 */
export const validationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === "test" ? 10000 : 1200, // supports 50+ concurrent teams submitting simultaneously
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
 * Scaled for simultaneous tournament opening where 50+ squads log in at once from venue Wi-Fi.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 10000 : 600, // permits 600 logins/min so 50+ squads can log in concurrently
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "TOO_MANY_LOGIN_ATTEMPTS",
    message: "Too many login attempts. Please wait 60 seconds before trying again.",
  },
});

