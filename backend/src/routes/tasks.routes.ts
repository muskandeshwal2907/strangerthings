import { Router } from "express";
import { TasksController } from "../controllers/tasks.controller";
import { validationRateLimiter } from "../middleware/rateLimiter.middleware";
import { extractAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(extractAuth());
router.post("/validate", validationRateLimiter, TasksController.validateTask);
router.post("/hint/unlock", TasksController.unlockHint);
router.post("/progress", TasksController.saveProgress);

export default router;
