"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controller/projectController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
// Project Routes
// Get Projects
router.get("/", projectController_1.getProjects);
router.get("/:projectId/users", projectController_1.getProjectUsers);
router.get("/:projectId/versions", projectController_1.getProjectVersionHistory);
router.get("/versions", projectController_1.getAllProjectVersions);
// Create Project
router.post("/", projectController_1.createProject);
router.post("/:projectId/archive", projectController_1.archiveAndIncrementVersion);
// Delete Project
router.delete("/:projectId", projectController_1.deleteProject);
// Update Project Version and Project
router.patch("/:projectId/version", projectController_1.incrementProjectVersion);
router.patch("/:projectId", projectController_1.updateProject);
exports.default = router;
