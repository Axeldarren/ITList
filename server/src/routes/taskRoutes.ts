import { Router } from "express";
import { createTask, deleteTask, getTaskById, getTasks, getUserTasks, updateTask, updateTaskStatus } from "../controller/taskController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(protect); // Protect all routes in this router

// Task Routes
// Get Tasks
router.get("/", getTasks);
router.get("/user/:userId", getUserTasks);
router.get("/:taskId", getTaskById);

// Create Task
router.post("/", createTask);

// Update Task Status and Task
router.patch("/:taskId/status", updateTaskStatus);
router.patch("/:taskId", updateTask);

// Delete Task
router.delete("/:taskId", deleteTask);

export default router;