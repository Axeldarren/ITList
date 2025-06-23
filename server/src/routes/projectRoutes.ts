import { Router } from "express";
import { createProject, getProjects, incrementProjectVersion } from "../controller/projectController";

const router = Router();

// Project Routes
router.get("/", getProjects);
router.post("/", createProject);
router.patch("/:projectId/version", incrementProjectVersion);

export default router;