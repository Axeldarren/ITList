import { Router } from "express";
import { archiveAndIncrementVersion, createProject, deleteProject, getAllProjectVersions, getProjects, getProjectUsers, getProjectVersionHistory, incrementProjectVersion, updateProject, updateProjectStatus } from "../controller/projectController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

// Project Routes
// Get Projects
router.get("/", getProjects);
router.get("/:projectId/users", getProjectUsers);
router.get("/:projectId/versions", getProjectVersionHistory);
router.get("/versions", getAllProjectVersions);

// Create Project
router.post("/", createProject);
router.post("/:projectId/archive", archiveAndIncrementVersion);

// Delete Project
router.delete("/:projectId", deleteProject);

// Update Project Version and Project
router.patch("/:projectId/version", incrementProjectVersion);
router.patch("/:projectId", updateProject);
router.patch("/:projectId/status", updateProjectStatus);

export default router;