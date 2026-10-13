import { Router } from "express";
import { ChaptersController } from "../controllers/chapters.controller";
import { validationRateLimiter } from "../middleware/rateLimiter.middleware";
import { extractAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(extractAuth());

router.get("/", ChaptersController.getSanitizedChapters);
router.get("/:id", ChaptersController.getSanitizedChapterById);
router.post("/validate", validationRateLimiter, ChaptersController.validateChapter);

export default router;
