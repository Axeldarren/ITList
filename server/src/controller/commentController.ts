// server/src/controller/commentController.ts

import { Request, Response } from "express";
import { PrismaClient, NotificationType } from "@prisma/client";
import {
    createMentionNotifications,
    createNotification,
    broadcastNotificationUpdate,
} from "../utils/notificationHelper";

const prisma = new PrismaClient();

export const createComment = async (req: Request, res: Response) => {
    const { text, taskId, maintenanceTaskId } = req.body;
    const loggedInUser = req.user;

    if (!text || (!taskId && !maintenanceTaskId) || !loggedInUser) {
        return res.status(400).json({ message: "Missing required fields or user not logged in." });
    }

    try {
        // Check if the user has a timer running on this task or maintenance task
        let runningTimer;
        if (taskId) {
            runningTimer = await prisma.timeLog.findFirst({
                where: {
                    taskId: Number(taskId),
                    userId: loggedInUser.userId,
                    endTime: null, // This signifies an active timer
                }
            });
        } else if (maintenanceTaskId) {
            runningTimer = await prisma.timeLog.findFirst({
                where: {
                    maintenanceTaskId: Number(maintenanceTaskId),
                    userId: loggedInUser.userId,
                    endTime: null, // This signifies an active timer
                }
            });
        }

        if (!runningTimer) {
            // If no timer is running, the user is not allowed to comment.
            return res.status(403).json({ message: "You must have a timer running on this task to post a comment." });
        }

        const newComment = await prisma.comment.create({
            data: {
                text,
                taskId: taskId ? Number(taskId) : null,
                maintenanceTaskId: maintenanceTaskId ? Number(maintenanceTaskId) : null,
                userId: loggedInUser.userId,
                updatedById: loggedInUser.userId,
            },
            include: { user: true },
        });

        // Create activity for regular tasks
        if (taskId) {
            const task = await prisma.task.findUnique({ where: { id: Number(taskId) } });
            if (task) {
                await prisma.activity.create({
                    data: {
                        projectId: task.projectId,
                        userId: loggedInUser.userId,
                        taskId: Number(taskId),
                        type: 'COMMENT_ADDED',
                        description: `commented on task "${task.title}"`
                    }
                });

                // --- Notification: @mentions ---
                const mentionedIds = await createMentionNotifications({
                    text,
                    authorUserId: loggedInUser.userId,
                    authorUsername: loggedInUser.username,
                    taskId: task.id,
                    projectId: task.projectId,
                    commentId: newComment.id,
                    contextLabel: `task "${task.title}"`,
                });

                // --- Notification: COMMENT_ADDED to assignee (if not the commenter and not already mentioned) ---
                if (
                    task.assignedUserId &&
                    task.assignedUserId !== loggedInUser.userId &&
                    !mentionedIds.has(task.assignedUserId)
                ) {
                    await createNotification({
                        type: NotificationType.COMMENT_ADDED,
                        title: "New comment on your task",
                        message: `${loggedInUser.username} commented on task "${task.title}".`,
                        userId: task.assignedUserId,
                        taskId: task.id,
                        projectId: task.projectId,
                        commentId: newComment.id,
                    });
                }

                broadcastNotificationUpdate();
            }
        }
        
        res.status(201).json(newComment);
    } catch (error: any) {
        res.status(500).json({ message: `Error creating comment: ${error.message}` });
    }
};

export const updateComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { text } = req.body;
    const loggedInUser = req.user;

    if (!text) {
        return res.status(400).json({ message: "Comment text cannot be empty." });
    }

    try {
        const updatedComment = await prisma.comment.update({
            where: { id: Number(commentId) },
            data: { 
                text,
                updatedById: loggedInUser?.userId, // Stamp the updater
            },
            include: { user: true },
        });
        res.status(200).json(updatedComment);
    } catch (error: any) {
        res.status(500).json({ message: `Error updating comment: ${error.message}` });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const loggedInUser = req.user;

    try {
        await prisma.comment.update({
            where: { id: Number(commentId) },
            data: {
                deletedAt: new Date(),
                deletedById: loggedInUser?.userId,
            },
        });
        res.status(200).json({ message: "Comment deleted successfully." });
    } catch (error: any) {
        res.status(500).json({ message: `Error deleting comment: ${error.message}` });
    }
};

export const createDevlogComment = async (req: Request, res: Response) => {
    const { text, taskId } = req.body;
    const loggedInUser = req.user;

    if (!text || !taskId || !loggedInUser) {
        return res.status(400).json({ message: "Missing required fields or user not logged in." });
    }

    try {
        // Just create a regular comment - devlog functionality is now handled by the unified timer system
        const newComment = await prisma.comment.create({
            data: {
                text,
                taskId: Number(taskId),
                userId: loggedInUser.userId,
                updatedById: loggedInUser.userId,
            },
            include: { user: true },
        });

        const task = await prisma.task.findUnique({ where: { id: Number(taskId) } });
        if (task) {
            await prisma.activity.create({
                data: {
                    projectId: task.projectId,
                    userId: loggedInUser.userId,
                    taskId: Number(taskId),
                    type: 'COMMENT_ADDED',
                    description: `added comment on task "${task.title}"`
                }
            });

            // --- Notification: @mentions ---
            const mentionedIds = await createMentionNotifications({
                text,
                authorUserId: loggedInUser.userId,
                authorUsername: loggedInUser.username,
                taskId: task.id,
                projectId: task.projectId,
                commentId: newComment.id,
                contextLabel: `task "${task.title}"`,
            });

            // --- Notification: COMMENT_ADDED to assignee ---
            if (
                task.assignedUserId &&
                task.assignedUserId !== loggedInUser.userId &&
                !mentionedIds.has(task.assignedUserId)
            ) {
                await createNotification({
                    type: NotificationType.COMMENT_ADDED,
                    title: "New comment on your task",
                    message: `${loggedInUser.username} commented on task "${task.title}".`,
                    userId: task.assignedUserId,
                    taskId: task.id,
                    projectId: task.projectId,
                    commentId: newComment.id,
                });
            }

            broadcastNotificationUpdate();
        }
        
        res.status(201).json(newComment);
    } catch (error: any) {
        res.status(500).json({ message: `Error creating comment: ${error.message}` });
    }
};

export const stopDevlogTimer = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const loggedInUser = req.user;

    if (!loggedInUser) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    try {
        // This endpoint is now deprecated - return appropriate message
        res.status(410).json({ 
            message: "Devlog timer functionality has been replaced by the unified timer system. Please use the regular timer endpoints." 
        });
    } catch (error: any) {
        res.status(500).json({ message: `Error: ${error.message}` });
    }
};

export const getActiveDevlogs = async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    try {
        // Return empty array since devlogs are now handled by the unified timer system
        res.json([]);
    } catch (error: any) {
        res.status(500).json({ message: `Error retrieving active devlogs: ${error.message}` });
    }
};

// Get comments for maintenance task
export const getMaintenanceTaskComments = async (req: Request, res: Response): Promise<void> => {
    const { maintenanceTaskId } = req.params;

    try {
        const comments = await prisma.comment.findMany({
            where: {
                maintenanceTaskId: Number(maintenanceTaskId),
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        profilePictureUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.json(comments);
    } catch (error: any) {
        res.status(500).json({ message: `Error fetching maintenance task comments: ${error.message}` });
    }
};

// ──────────────────────────────────────────
// Standalone comment (no timer required)
// ──────────────────────────────────────────
export const createStandaloneComment = async (req: Request, res: Response) => {
    const { text, taskId, parentId } = req.body;
    const loggedInUser = req.user;

    if (!text || !taskId || !loggedInUser) {
        return res.status(400).json({ message: "Missing required fields or user not logged in." });
    }

    try {
        // If this is a reply, verify parent exists and belongs to the same task
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: Number(parentId) },
            });
            if (!parentComment || parentComment.taskId !== Number(taskId)) {
                return res.status(400).json({ message: "Invalid parent comment." });
            }
        }

        const newComment = await prisma.comment.create({
            data: {
                text,
                taskId: Number(taskId),
                userId: loggedInUser.userId,
                updatedById: loggedInUser.userId,
                parentId: parentId ? Number(parentId) : null,
            },
            include: {
                user: {
                    select: { userId: true, username: true, profilePictureUrl: true },
                },
                replies: {
                    include: {
                        user: {
                            select: { userId: true, username: true, profilePictureUrl: true },
                        },
                    },
                },
            },
        });

        const task = await prisma.task.findUnique({ where: { id: Number(taskId) } });
        if (task) {
            // Activity record
            await prisma.activity.create({
                data: {
                    projectId: task.projectId,
                    userId: loggedInUser.userId,
                    taskId: Number(taskId),
                    type: "COMMENT_ADDED",
                    description: parentId
                        ? `replied to a comment on task "${task.title}"`
                        : `commented on task "${task.title}"`,
                },
            });

            // --- Notification: @mentions ---
            const mentionedIds = await createMentionNotifications({
                text,
                authorUserId: loggedInUser.userId,
                authorUsername: loggedInUser.username,
                taskId: task.id,
                projectId: task.projectId,
                commentId: newComment.id,
                contextLabel: `task "${task.title}"`,
            });

            // --- Notification: COMMENT_ADDED to assignee ---
            if (
                task.assignedUserId &&
                task.assignedUserId !== loggedInUser.userId &&
                !mentionedIds.has(task.assignedUserId)
            ) {
                await createNotification({
                    type: NotificationType.COMMENT_ADDED,
                    title: "New comment on your task",
                    message: `${loggedInUser.username} commented on task "${task.title}".`,
                    userId: task.assignedUserId,
                    taskId: task.id,
                    projectId: task.projectId,
                    commentId: newComment.id,
                });
            }

            // --- Notification: Reply to parent comment author ---
            if (parentId) {
                const parentComment = await prisma.comment.findUnique({
                    where: { id: Number(parentId) },
                    select: { userId: true },
                });
                if (
                    parentComment &&
                    parentComment.userId !== loggedInUser.userId &&
                    !mentionedIds.has(parentComment.userId) &&
                    parentComment.userId !== task.assignedUserId
                ) {
                    await createNotification({
                        type: NotificationType.COMMENT_ADDED,
                        title: "Reply to your comment",
                        message: `${loggedInUser.username} replied to your comment on task "${task.title}".`,
                        userId: parentComment.userId,
                        taskId: task.id,
                        projectId: task.projectId,
                        commentId: newComment.id,
                    });
                }
            }

            broadcastNotificationUpdate();
        }

        res.status(201).json(newComment);
    } catch (error: any) {
        console.error("Error creating standalone comment:", error);
        res.status(500).json({ message: `Error creating comment: ${error.message}` });
    }
};

// ──────────────────────────────────────────
// Get task comments (top-level + nested replies)
// ──────────────────────────────────────────
export const getTaskComments = async (req: Request, res: Response) => {
    const { taskId } = req.params;

    try {
        const comments = await prisma.comment.findMany({
            where: {
                taskId: Number(taskId),
                parentId: null,        // Only top-level comments
                deletedAt: null,
                timeLog: { is: null }, // Correct syntax for "is null" on one-to-one relation
            },
            include: {
                user: {
                    select: { userId: true, username: true, profilePictureUrl: true },
                },
                replies: {
                    where: { deletedAt: null },
                    include: {
                        user: {
                            select: { userId: true, username: true, profilePictureUrl: true },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(comments);
    } catch (error: any) {
        console.error("Error fetching task comments:", error);
        res.status(500).json({ message: `Error fetching task comments: ${error.message}` });
    }
};