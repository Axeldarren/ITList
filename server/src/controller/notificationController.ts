import { Request, Response } from "express";
import { PrismaClient, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

// Category-to-types mapping
const CATEGORY_TYPES: Record<string, NotificationType[]> = {
    deadlines: [
        NotificationType.TASK_DEADLINE_APPROACHING,
        NotificationType.TASK_OVERDUE,
        NotificationType.PROJECT_AT_RISK,
    ],
    comments: [
        NotificationType.COMMENT_ADDED,
        NotificationType.MILESTONE_COMMENT_ADDED,
    ],
    mentions: [
        NotificationType.MENTIONED,
    ],
};

// GET /notifications?page=1&limit=20&category=all
export const getNotifications = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const category = (req.query.category as string) || "all";
        const skip = (page - 1) * limit;

        // Build where clause with optional category filter
        const where: any = { userId };
        if (category === "unread") {
            where.isRead = false;
        } else if (category !== "all" && CATEGORY_TYPES[category]) {
            where.type = { in: CATEGORY_TYPES[category] };
        }

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
        ]);

        res.json({
            data: notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        res.status(500).json({
            message: `Error retrieving notifications: ${error.message}`,
        });
    }
};

// GET /notifications/unread-count
export const getUnreadCount = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const count = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        res.json({ count });
    } catch (error: any) {
        res.status(500).json({
            message: `Error retrieving unread count: ${error.message}`,
        });
    }
};

// PATCH /notifications/:id/read
export const markAsRead = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const notification = await prisma.notification.updateMany({
            where: { id: parseInt(id), userId },
            data: { isRead: true },
        });

        if (notification.count === 0) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }

        res.json({ message: "Notification marked as read" });
    } catch (error: any) {
        res.status(500).json({
            message: `Error marking notification as read: ${error.message}`,
        });
    }
};

// PATCH /notifications/read-all
export const markAllAsRead = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
        res.status(500).json({
            message: `Error marking all as read: ${error.message}`,
        });
    }
};

// DELETE /notifications/:id
export const deleteNotification = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const deleted = await prisma.notification.deleteMany({
            where: { id: parseInt(id), userId },
        });

        if (deleted.count === 0) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }

        res.json({ message: "Notification deleted" });
    } catch (error: any) {
        res.status(500).json({
            message: `Error deleting notification: ${error.message}`,
        });
    }
};
