import { Router } from "express";
import { getDeveloperStats } from "../controller/productivityController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

// Protect all routes in this file and restrict to admins
router.use(protect, restrictToAdmin);

router.get("/", getDeveloperStats);

export default router;