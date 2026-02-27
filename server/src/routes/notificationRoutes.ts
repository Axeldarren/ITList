import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controller/notificationController";

const router = Router();

// All notification routes require authentication
router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead); // Must be before /:id routes
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
