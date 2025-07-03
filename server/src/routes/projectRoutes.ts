import { Router } from "express";
import { createProject, deleteProject, getProjects, getProjectUsers, incrementProjectVersion } from "../controller/projectController";

const router = Router();

// Project Routes
router.get("/", getProjects);
router.post("/", createProject);
router.delete("/:projectId", deleteProject)
router.get("/:projectId/users", getProjectUsers);
router.patch("/:projectId/version", incrementProjectVersion);

export default router;