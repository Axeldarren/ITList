// server/src/routes/commentRoutes.ts

import { Router } from "express";
import { 
  createComment, 
  updateComment, 
  deleteComment,
  createDevlogComment,
  stopDevlogTimer,
  getActiveDevlogs,
  getMaintenanceTaskComments,
  createStandaloneComment,
  getTaskComments
} from "../controller/commentController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

// Regular comment routes
router.post("/", (req, res, next) => {
    Promise.resolve(createComment(req, res)).catch(next);
});
router.patch("/:commentId", (req, res, next) => {
    Promise.resolve(updateComment(req, res)).catch(next);
});
router.delete("/:commentId", (req, res, next) => {
    Promise.resolve(deleteComment(req, res)).catch(next);
});

// Standalone comment (no timer required)
router.post("/standalone", (req, res, next) => {
    Promise.resolve(createStandaloneComment(req, res)).catch(next);
});

// Get task discussion comments (excludes devlogs)
router.get("/task/:taskId", (req, res, next) => {
    Promise.resolve(getTaskComments(req, res)).catch(next);
});

// Devlog routes
router.post("/devlog", (req, res, next) => {
    Promise.resolve(createDevlogComment(req, res)).catch(next);
});
router.patch("/:commentId/stop-devlog", (req, res, next) => {
    Promise.resolve(stopDevlogTimer(req, res)).catch(next);
});
router.get("/active-devlogs", (req, res, next) => {
    Promise.resolve(getActiveDevlogs(req, res)).catch(next);
});

// Maintenance task comments
router.get("/maintenance-task/:maintenanceTaskId", (req, res, next) => {
    Promise.resolve(getMaintenanceTaskComments(req, res)).catch(next);
});

export default router;