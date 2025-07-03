import { Router } from "express";
import { createTask, deleteTask, getTasks, getUserTasks, updateTaskStatus } from "../controller/taskController";

const router = Router();

// Task Routes
router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:taskId/status", updateTaskStatus);
router.get("/user/:userId", getUserTasks);
router.delete("/:taskId", deleteTask);

export default router;