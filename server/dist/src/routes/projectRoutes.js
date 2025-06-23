"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controller/projectController");
const router = (0, express_1.Router)();
// Project Routes
router.get("/", projectController_1.getProjects);
router.post("/", projectController_1.createProject);
router.patch("/:projectId/version", projectController_1.incrementProjectVersion);
exports.default = router;
