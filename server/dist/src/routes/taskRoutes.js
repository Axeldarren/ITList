"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controller/taskController");
const router = (0, express_1.Router)();
// Task Routes
router.get("/", taskController_1.getTasks);
router.post("/", taskController_1.createTask);
router.patch("/:taskId/status", taskController_1.updateTaskStatus);
router.get("/user/:userId", taskController_1.getUserTasks);
router.delete("/:taskId", taskController_1.deleteTask);
exports.default = router;
