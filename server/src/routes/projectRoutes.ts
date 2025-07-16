import { Router } from "express";
import { createProject, deleteProject, getProjects, getProjectUsers, incrementProjectVersion, updateProject } from "../controller/projectController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

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