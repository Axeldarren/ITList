"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controller/taskController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect); // Protect all routes in this router
// Task Routes
// Get Tasks
router.get("/", taskController_1.getTasks);
router.get("/user/:userId", taskController_1.getUserTasks);
router.get("/:taskId", taskController_1.getTaskById);
// Create Task
router.post("/", taskController_1.createTask);
// Update Task Status and Task
router.patch("/:taskId/status", taskController_1.updateTaskStatus);
router.patch("/:taskId", taskController_1.updateTask);
// Delete Task
router.delete("/:taskId", taskController_1.deleteTask);
exports.default = router;
