import { Router } from "express";
import { createTask, deleteTask, getTaskById, getTasks, getUserTasks, updateTask, updateTaskStatus } from "../controller/taskController";

const router = Router();

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