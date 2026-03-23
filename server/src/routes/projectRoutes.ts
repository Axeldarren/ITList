import { Router } from "express";
import { archiveAndIncrementVersion, createProject, deleteProject, getAllProjectVersions, getProjectActivities, getProjects, getProjectUsers, getProjectVersionHistory, incrementProjectVersion, updateProject, updateProjectStatus, getTimelineProjects, getMilestoneComments, createMilestoneComment, updateMilestoneComment, deleteMilestoneComment } from "../controller/projectController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";
import uploadImageMemory from "../middleware/uploadImageMemory";

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
router.post("/:projectId/milestone-comments", uploadImageMemory.single("image"), createMilestoneComment);

// Delete Project
router.delete("/:projectId", restrictToAdmin, deleteProject);
router.delete("/:projectId/milestone-comments/:commentId", deleteMilestoneComment);

// Update Project Version and Project
router.patch("/:projectId/version", incrementProjectVersion);
router.patch("/:projectId", restrictToAdmin, updateProject);
router.patch("/:projectId/status", updateProjectStatus);
router.patch("/:projectId/milestone-comments/:commentId", updateMilestoneComment);

export default router;