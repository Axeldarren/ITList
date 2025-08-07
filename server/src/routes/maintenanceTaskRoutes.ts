import { Router } from "express";
import {
  getMaintenanceTaskTimeLogs,
  startMaintenanceTaskTimer,
} from "../controller/productMaintenanceController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect); // Protect all routes in this router

// Unified Timer System routes for maintenance tasks
router.get("/:maintenanceTaskId/time-logs", getMaintenanceTaskTimeLogs);
router.post("/:maintenanceTaskId/timer/start", startMaintenanceTaskTimer);

export default router;
