import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Start a new timer for a task
export const startTimer = async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.body;
    const loggedInUser = req.user;

    if (!taskId || !loggedInUser) {
        res.status(400).json({ message: "Task ID and user are required." });
        return;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check for any other running timers for this user
            const runningTimer = await tx.timeLog.findFirst({
                where: { userId: loggedInUser.userId, endTime: null }
            });

            if (runningTimer) {
                // By throwing an error inside a transaction, we ensure it fails safely.
                throw new Error("You already have a timer running on another task.");
            }

            // 2. Find the parent project of the task
            const task = await tx.task.findUnique({
                where: { id: Number(taskId) },
                select: { projectId: true }
            });

            if (!task) {
                throw new Error("Task not found.");
            }

            const project = await tx.project.findUnique({
                where: { id: task.projectId }
            });

            // 3. If the project status is 'Start', update it to 'OnProgress'
            if (project?.status === 'Start') {
                await tx.project.update({
                    where: { id: project.id },
                    data: { 
                        status: 'OnProgress',
                        updatedById: loggedInUser.userId
                    },
                });
                
                // Also log this automatic status change to the history
                await tx.projectStatusHistory.create({
                    data: {
                        projectId: project.id,
                        status: 'OnProgress',
                        changedById: loggedInUser.userId,
                    }
                });
            }

            // 4. Create the new time log entry
            const newLog = await tx.timeLog.create({
                data: {
                    startTime: new Date(),
                    taskId: Number(taskId),
                    userId: loggedInUser.userId,
                }
            });

            return newLog;
        });
        
        res.status(201).json(result);

    } catch (error: any) {
        // Handle the specific error we threw in the transaction
        if (error.message.includes("You already have a timer running")) {
            res.status(409).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: `Error starting timer: ${error.message}` });
    }
};

const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return [
        h > 0 ? `${h}h` : '',
        m > 0 ? `${m}m` : '',
        s > 0 ? `${s}s` : '',
    ].filter(Boolean).join(' ');
};

// ... (startTimer function remains the same)

export const stopTimer = async (req: Request, res: Response): Promise<void> => {
    const { logId, commentText } = req.body;
    const loggedInUser = req.user;

    if (!commentText || !commentText.trim()) {
        res.status(400).json({ message: "A comment is required to describe the work done." });
        return;
    }

    try {
        const log = await prisma.timeLog.findUnique({ where: { id: Number(logId) } });

        if (!log || log.userId !== loggedInUser?.userId || log.endTime) {
            res.status(403).json({ message: "Timer not found or you do not have permission to stop it." });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const endTime = new Date();
            const durationInSeconds = Math.round((endTime.getTime() - log.startTime.getTime()) / 1000);
            
            // --- THIS IS THE FIX ---
            // Format the duration and place it on a new line above the comment.
            const formattedDuration = formatDuration(durationInSeconds);
            const finalCommentText = `[Time Logged: ${formattedDuration}]\n${commentText}`;

            const newComment = await tx.comment.create({
                data: {
                    text: finalCommentText,
                    taskId: log.taskId,
                    userId: loggedInUser.userId,
                    updatedById: loggedInUser.userId,
                }
            });

            const updatedLog = await tx.timeLog.update({
                where: { id: Number(logId) },
                data: { 
                    endTime, 
                    duration: durationInSeconds,
                    commentId: newComment.id,
                },
            });

            return updatedLog;
        });

        res.status(200).json(result);

    } catch (error: any) {
        res.status(500).json({ message: `Error stopping timer: ${error.message}` });
    }
};