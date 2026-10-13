import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth, extractAuth } from "../middleware/auth.middleware";
import { loginRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.post("/login", loginRateLimiter, AuthController.login);
router.post("/logout", extractAuth(), AuthController.logout);
router.post("/admin-login", loginRateLimiter, AuthController.adminLogin);
router.get("/me", requireAuth(), AuthController.getMe);

export default router;
