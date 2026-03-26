import { Router } from "express";
import { getDeveloperStats } from "../controller/productivityController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = Router();

// Protect all routes in this file and restrict to admins and business owners
router.use(protect, restrictTo('ADMIN', 'BUSINESS_OWNER'));

router.get("/", getDeveloperStats);

export default router;