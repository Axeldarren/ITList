import { Router } from "express";
import {
  getProductMaintenances,
  getProductMaintenanceById,
  createProductMaintenance,
  updateProductMaintenance,
  deleteProductMaintenance,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  getFinishedProjects,
  getMaintenanceTimeLogs,
  startMaintenanceTimeLog,
  stopMaintenanceTimeLog,
  deleteMaintenanceTimeLog,
  // New unified timer system functions
  getMaintenanceTaskTimeLogs,
  startMaintenanceTaskTimer,
  stopMaintenanceTaskTimer,
} from "../controller/productMaintenanceController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect); // Protect all routes in this router

// Product Maintenance routes
router.get("/", getProductMaintenances);
router.get("/finished-projects", getFinishedProjects);
router.get("/:id", getProductMaintenanceById);
router.post("/", createProductMaintenance);
router.patch("/:id", updateProductMaintenance);
router.delete("/:id", deleteProductMaintenance);

// Maintenance Task routes
router.post("/:productMaintenanceId/tasks", createMaintenanceTask);
router.patch("/tasks/:id", updateMaintenanceTask);
router.delete("/tasks/:id", deleteMaintenanceTask);

// Maintenance Time Log routes (legacy)
router.get("/:productMaintenanceId/time-logs", getMaintenanceTimeLogs);
router.post("/:productMaintenanceId/time-logs", startMaintenanceTimeLog);
router.patch("/time-logs/:id/stop", stopMaintenanceTimeLog);
router.delete("/time-logs/:id", deleteMaintenanceTimeLog);

// New unified timer system routes
router.get("/tasks/:maintenanceTaskId/time-logs", getMaintenanceTaskTimeLogs);
router.post("/tasks/:maintenanceTaskId/timer/start", startMaintenanceTaskTimer);
router.post("/tasks/:maintenanceTaskId/timer/stop", stopMaintenanceTaskTimer);

export default router;
