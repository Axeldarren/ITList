import { Router } from "express";
import { archiveAndIncrementVersion, createProject, deleteProject, getAllProjectVersions, getProjects, getProjectUsers, getProjectVersionHistory, incrementProjectVersion, updateProject, updateProjectStatus } from "../controller/projectController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

// Project Routes
// Get Projects
router.get("/", getProjects);
router.get("/:projectId/users", getProjectUsers);
router.get("/:projectId/versions", getProjectVersionHistory);
router.get("/versions", getAllProjectVersions);

// Create Project
router.post("/", restrictToAdmin, createProject);
router.post("/:projectId/archive", restrictToAdmin, archiveAndIncrementVersion);

// Delete Project
router.delete("/:projectId", restrictToAdmin, deleteProject);

// Update Project Version and Project
router.patch("/:projectId/version", incrementProjectVersion);
router.patch("/:projectId", restrictToAdmin, updateProject);
router.patch("/:projectId/status", updateProjectStatus);

export default router;