import { Router } from "express";
import { archiveAndIncrementVersion, createProject, deleteProject, getAllProjectVersions, getProjectActivities, getProjects, getProjectUsers, getProjectVersionHistory, incrementProjectVersion, updateProject, updateProjectStatus, getTimelineProjects, getMilestoneComments, createMilestoneComment } from "../controller/projectController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

// Project Routes
// Get Projects
router.get("/", getProjects);
router.get("/timeline", getTimelineProjects);
router.get("/:projectId/users", getProjectUsers);
router.get("/:projectId/versions", getProjectVersionHistory);
router.get("/:projectId/activities", getProjectActivities); 
router.get("/versions", getAllProjectVersions);
router.get("/:projectId/milestone-comments", getMilestoneComments);

// Create Project
router.post("/", restrictToAdmin, createProject);
router.post("/:projectId/archive", restrictToAdmin, archiveAndIncrementVersion);
router.post("/:projectId/milestone-comments", createMilestoneComment);

// Delete Project
router.delete("/:projectId", restrictToAdmin, deleteProject);

// Update Project Version and Project
router.patch("/:projectId/version", incrementProjectVersion);
router.patch("/:projectId", restrictToAdmin, updateProject);
router.patch("/:projectId/status", updateProjectStatus);

export default router;