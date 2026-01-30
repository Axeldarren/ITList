import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";

const prisma = new PrismaClient();

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : "", s > 0 ? `${s}s` : ""]
    .filter(Boolean)
    .join(" ");
};

// Start a new timer for a task
export const startTimer = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        where: { userId: loggedInUser.userId, endTime: null },
      });

      if (runningTimer) {
        // By throwing an error inside a transaction, we ensure it fails safely.
        throw new Error("You already have a timer running on another task.");
      }

      // 2. Find the parent project of the task
      const task = await tx.task.findUnique({
        where: { id: Number(taskId) },
        select: { projectId: true },
      });

      if (!task) {
        throw new Error("Task not found.");
      }

      const project = await tx.project.findUnique({
        where: { id: task.projectId },
      });

      // 3. If the project status is 'Start', update it to 'OnProgress'
      if (project?.status === "Start") {
        await tx.project.update({
          where: { id: project.id },
          data: {
            status: "OnProgress",
            updatedById: loggedInUser.userId,
          },
        });

        // Also log this automatic status change to the history
        await tx.projectStatusHistory.create({
          data: {
            projectId: project.id,
            status: "OnProgress",
            changedById: loggedInUser.userId,
          },
        });
      }

      // 4. Create the new time log entry
      const newLog = await tx.timeLog.create({
        data: {
          startTime: new Date(),
          taskId: Number(taskId),
          userId: loggedInUser.userId,
        },
      });

      // Broadcast the timer start event
      broadcast({
        type: 'TIMELOG_UPDATE',
        projectId: task.projectId,
        taskId: Number(taskId),
        userId: loggedInUser.userId,
        message: {
          type: 'TIMER_STARTED',
          timeLogId: newLog.id,
          userId: loggedInUser.userId
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

export const stopTimer = async (req: Request, res: Response): Promise<void> => {
  const { logId, commentText } = req.body;
  const loggedInUser = req.user;

  if (!commentText || !commentText.trim()) {
    res
      .status(400)
      .json({ message: "A comment is required to describe the work done." });
    return;
  }

  try {
    const log = await prisma.timeLog.findUnique({
      where: { id: Number(logId) },
      include: { task: true }
    });

    if (!log || log.userId !== loggedInUser?.userId || log.endTime) {
      res
        .status(403)
        .json({
          message: "Timer not found or you do not have permission to stop it.",
        });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const endTime = new Date();
      const durationInSeconds = Math.round(
        (endTime.getTime() - log.startTime.getTime()) / 1000
      );

      const formattedDuration = formatDuration(durationInSeconds);
      const finalCommentText = `[Time Logged: ${formattedDuration}]\n${commentText}`;

      const newComment = await tx.comment.create({
        data: {
          text: finalCommentText,
          taskId: log.taskId,
          userId: loggedInUser.userId,
          updatedById: loggedInUser.userId,
        },
      });

      const updatedLog = await tx.timeLog.update({
        where: { id: Number(logId) },
        data: {
          endTime,
          duration: durationInSeconds,
          commentId: newComment.id,
        },
      });

        await tx.activity.create({
            data: {
                projectId: log.task?.projectId || 0, // Safe access with fallback
                userId: loggedInUser.userId,
                taskId: log.taskId,
                type: 'COMMENT_ADDED',
                description: `commented on task "${log.task?.title || 'Unknown Task'}"`
            }
        });

        // Broadcast the timer stop event
        broadcast({
            type: 'TIMELOG_UPDATE',
            projectId: log.task?.projectId,
            taskId: log.taskId,
            userId: loggedInUser.userId,
            message: {
                type: 'TIMER_STOPPED',
                timeLogId: Number(logId),
                duration: durationInSeconds,
                userId: loggedInUser.userId
            }
        });

        // Broadcast the task update for the timer stop
        broadcast({
            type: 'UPDATE',
            projectId: log.task?.projectId,
            taskId: log.taskId,
            message: {
          type: 'TASK_UPDATED',
            }
        });

        // Broadcast the comment addition
        broadcast({
            type: 'UPDATE',
            projectId: log.task?.projectId,
            taskId: log.taskId,
            message: {
          type: 'COMMENT_ADDED',
          commentId: newComment.id,
          userId: loggedInUser.userId,
          username: loggedInUser.username
            }
        });

      return updatedLog;
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: `Error stopping timer: ${error.message}` });
  }
};

export const getAllTimeLogs = async (req: Request, res: Response) => {
  try {
    const { userId, month, page, limit } = req.query as { 
      userId?: string; 
      month?: string;
      page?: string;
      limit?: string;
    };
    
    // Pagination defaults
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Build the where clause
    let whereClause: any = {};
    
    // Filter by user if userId is provided
    if (userId) whereClause.userId = userId;
    
    // Filter by month if month is provided
    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.startTime = { gte: startDate, lte: endDate };
    }
    
    // Include both regular task logs (only for non-deleted tasks) and maintenance task logs
    whereClause.OR = [
      { task: { deletedAt: null } },
      { maintenanceTaskId: { not: null } }
    ];
    
    // Get total count for pagination meta
    const total = await prisma.timeLog.count({ where: whereClause });
    
    const timeLogs = await prisma.timeLog.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true } },
        task: { select: { title: true, deletedAt: true, projectId: true } },
        maintenanceTask: {
          select: {
            id: true,
            title: true,
            productMaintenanceId: true,
            productMaintenance: { select: { id: true, name: true, status: true } }
          }
        }
      },
      orderBy: {
        startTime: "desc",
      },
      skip: page && limit ? skip : undefined,
      take: page && limit ? limitNum : undefined,
    });
    
    // Return paginated response if pagination params provided
    if (page && limit) {
      res.status(200).json({
        data: timeLogs,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } else {
      // Return array for backward compatibility
      res.status(200).json(timeLogs);
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error fetching all time logs: ${error.message}` });
  }
};

export const getRunningTimeLog = async (req: Request, res: Response): Promise<void> => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        res.status(401).json({ message: "Not authorized." });
        return;
    }

    try {
        const runningLog = await prisma.timeLog.findFirst({
            where: {
                userId: loggedInUser.userId,
                endTime: null, // The key indicator of a running timer
                task: {
                    deletedAt: null // Only include non-deleted tasks
                }
            },
            include: {
                task: {
                    include: {
                        project: true, // Include project details
                    },
                },
            },
        });

        res.status(200).json(runningLog); // Will be null if no timer is running
    } catch (error: any) {
        res.status(500).json({ message: `Error fetching running time log: ${error.message}` });
    }
};

// Unified stop timer function for both tasks and maintenance tasks
export const stopTimerById = async (req: Request, res: Response): Promise<void> => {
    const { logId } = req.params;
    const { description } = req.body;
    const loggedInUser = req.user;

    if (!description || !description.trim()) {
        res.status(400).json({ message: "A description is required to describe the work done." });
        return;
    }

    try {
        const log = await prisma.timeLog.findUnique({
            where: { id: Number(logId) },
            include: { 
                task: { include: { project: true } },
                maintenanceTask: { include: { productMaintenance: true } }
            }
        });

        if (!log || log.userId !== loggedInUser?.userId || log.endTime) {
            res.status(403).json({
                message: "Timer not found or you do not have permission to stop it.",
            });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const endTime = new Date();
            const durationInSeconds = Math.round(
                (endTime.getTime() - log.startTime.getTime()) / 1000
            );

            // Update the time log
            const updatedLog = await tx.timeLog.update({
                where: { id: Number(logId) },
                data: {
                    endTime: endTime,
                    duration: durationInSeconds,
                    description: description,
                }
            });

            // Create a comment based on whether it's a task or maintenance task
            let newComment;
            const formattedDuration = formatDuration(durationInSeconds);
            const finalCommentText = `[Time Logged: ${formattedDuration}]\n${description}`;

            if (log.taskId) {
                // Regular task comment
                newComment = await tx.comment.create({
                    data: {
                        text: finalCommentText,
                        taskId: log.taskId,
                        userId: loggedInUser!.userId,
                    }
                });
            } else if (log.maintenanceTaskId) {
                // Maintenance task comment  
                newComment = await tx.comment.create({
                    data: {
                        text: finalCommentText,
                        maintenanceTaskId: log.maintenanceTaskId,
                        userId: loggedInUser!.userId,
                    }
                });
            }

            // Link the comment to the time log
            if (newComment) {
                await tx.timeLog.update({
                    where: { id: Number(logId) },
                    data: { commentId: newComment.id }
                });
            }

            return { updatedLog, newComment };
        });

        // Broadcast appropriate update
        if (log.taskId) {
            broadcast({
                type: 'TIMELOG_UPDATE',
                projectId: log.task?.projectId,
                taskId: log.taskId,
                userId: loggedInUser!.userId,
                message: {
                    type: 'TIMER_STOPPED',
                    timeLogId: Number(logId),
                    userId: loggedInUser!.userId
                }
            });
        } else if (log.maintenanceTaskId) {
            broadcast({
                type: 'MAINTENANCE_TIME_LOG_UPDATE',
                action: 'stopped',
                productMaintenanceId: log.maintenanceTask?.productMaintenanceId,
                maintenanceTaskId: log.maintenanceTaskId,
                timeLogId: Number(logId),
                userId: loggedInUser!.userId,
            });
        }

        res.json(result.updatedLog);
    } catch (error: any) {
        res.status(500).json({ message: `Error stopping timer: ${error.message}` });
    }
};

// Get all running time logs for all users
export const getAllRunningTimeLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const runningLogs = await prisma.timeLog.findMany({
      where: {
        endTime: null,
      },
      include: {
        user: { select: { userId: true, username: true, profilePictureUrl: true, isAdmin: true } },
        task: { select: { id: true, title: true, projectId: true, deletedAt: true, project: { select: { id: true, name: true } } } },
        maintenanceTask: { select: { id: true, title: true, productMaintenanceId: true, productMaintenance: { select: { id: true, name: true, status: true } } } },
      },
      orderBy: { startTime: 'desc' },
    });
    res.status(200).json(runningLogs);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching all running time logs: ${error.message}` });
  }
};