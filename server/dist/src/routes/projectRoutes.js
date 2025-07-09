"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controller/projectController");
const router = (0, express_1.Router)();
// Project Routes
router.get("/", projectController_1.getProjects);
router.get("/:projectId/users", projectController_1.getProjectUsers);
// Create Project
router.post("/", projectController_1.createProject);
// Delete Project
router.delete("/:projectId", projectController_1.deleteProject);
// Update Project Version and Project
router.patch("/:projectId/version", projectController_1.incrementProjectVersion);
router.patch("/:projectId", projectController_1.updateProject);
exports.default = router;
