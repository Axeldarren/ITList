import { Router } from "express";
import { createProject, deleteProject, getProjects, getProjectUsers, incrementProjectVersion, updateProject } from "../controller/projectController";

const router = Router();

// Project Routes
router.get("/", getProjects);
router.get("/:projectId/users", getProjectUsers);

// Create Project
router.post("/", createProject);

// Delete Project
router.delete("/:projectId", deleteProject);

// Update Project Version and Project
router.patch("/:projectId/version", incrementProjectVersion);
router.patch("/:projectId", updateProject);

export default router;