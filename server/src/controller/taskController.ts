import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";

const Prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response): Promise<void> => {
    const { projectId, version, page, limit, search } = req.query;

    const whereClause: any = {
        deletedAt: null, // Only fetch tasks that are not deleted
    };

    if (projectId) {
        whereClause.projectId = Number(projectId);
        if (version) {
            whereClause.version = Number(version);
        }
    }

    // Apply Search Filter
    const searchQuery = String(search || '').trim();
    if (searchQuery) {
        whereClause.OR = [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { contains: searchQuery, mode: 'insensitive' } }, // Assuming tags is a string
            { priority: { contains: searchQuery, mode: 'insensitive' } }
        ];
    }

    try {
        if (page && limit) {
             const pageNumber = Number(page);
             const limitNumber = Number(limit);
             const skip = (pageNumber - 1) * limitNumber;

             const totalTasks = await Prisma.task.count({ where: whereClause });
             const totalPages = Math.ceil(totalTasks / limitNumber);

             const tasks = await Prisma.task.findMany({
                where: whereClause,
                skip,
                take: limitNumber,
                include: {
                    author: true,
                    assignee: true,
                    comments: { where: { deletedAt: null } },
                    attachments: { where: { deletedAt: null } },
                    project: {
                        select: {
                            id: true,
                            name: true,
                            deletedAt: true
                        }
                    }
                }
            });

            res.json({
                data: tasks,
                meta: {
                    totalTasks,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages
                }
            });
        } else {
            // Original behavior for backward compatibility (e.g., BoardView)
            const tasks = await Prisma.task.findMany({
                where: whereClause,
                include: {
                    author: true,
                    assignee: true,
                    comments: { where: { deletedAt: null } },
                    attachments: { where: { deletedAt: null } },
                    project: {
                        select: {
                            id: true,
                            name: true,
                            deletedAt: true
                        }
                    }
                }
            });
            res.json(tasks);
        }
    } catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error}` });
    }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
    const { projectId, authorUserId, ...taskData } = req.body;
    const loggedInUser = req.user;

    if (!projectId || !loggedInUser) {
        res.status(400).json({ message: "A projectId and author are required." });
        return;
    }

    try {
        const project = await Prisma.project.findUnique({ where: { id: Number(projectId) } });
        if (!project) {
            res.status(404).json({ message: `Project with ID ${projectId} not found.` });
            return;
        }

        const newTask = await Prisma.task.create({
            data: {
                ...taskData,
                projectId: Number(projectId),
                version: project.version, // Assign task to the project's current version
                authorUserId: loggedInUser.userId,
                updatedById: loggedInUser.userId, // The creator is the first updater
            },
            include: {
                author: true,
                assignee: true,
                comments: { where: { deletedAt: null } },
                attachments: { where: { deletedAt: null } },
                project: {
                    select: {
                        id: true,
                        name: true,
                        deletedAt: true
                    }
                }
            }
        });

        await Prisma.activity.create({
            data: {
                projectId: Number(projectId),
                userId: loggedInUser.userId,
                taskId: newTask.id,
                type: 'TASK_CREATED',
                description: `created task "${newTask.title}"`
            }
        });

        broadcast({ type: 'UPDATE', projectId: newTask.projectId });

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: `Error creating task: ${error}` });
    }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const { status } = req.body;
    const loggedInUser = req.user;
    try {
        if (!loggedInUser) {
            res.status(401).json({ message: "Not authorized." });
            return;
        }
        
        const updatedTask = await Prisma.task.update({
            where: { id: Number(taskId) },
            data: {
                status: status,
                updatedById: loggedInUser?.userId, // Also stamp the updater here
            },
            include: {
                author: true,
                assignee: true,
                comments: { where: { deletedAt: null } },
                attachments: { where: { deletedAt: null } },
                project: {
                    select: {
                        id: true,
                        name: true,
                        deletedAt: true
                    }
                }
            }
        });

        await Prisma.activity.create({
            data: {
                projectId: updatedTask.projectId,
                userId: loggedInUser?.userId,
                taskId: updatedTask.id,
                type: 'TASK_STATUS_UPDATED',
                description: `updated status of task "${updatedTask.title}" to "${status}"`
            }
        });

        broadcast({ type: 'UPDATE', projectId: updatedTask.projectId });
        
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: `Error updating task status: ${error}` });
    }
};

export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { assignedOnly } = req.query;

  try {
    const whereClause: any = {
      deletedAt: null, // Only fetch non-deleted tasks
    };

    if (assignedOnly === 'true') {
        whereClause.assignedUserId = Number(userId);
    } else {
        whereClause.OR = [
            { authorUserId: Number(userId) },
            { assignedUserId: Number(userId) },
        ];
    }

    const tasks = await Prisma.task.findMany({
      where: whereClause,
      include: {
        author: true,
        assignee: true,
        project: {
          select: {
            id: true,
            name: true,
            deletedAt: true
          }
        }
      },
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving user's tasks: ${error.message}` });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const loggedInUser = req.user;
    const numericTaskId = Number(taskId);

    if (!loggedInUser) {
        res.status(401).json({ message: "Not authorized." });
        return;
    }

    try {
        const taskToDelete = await Prisma.task.findUnique({ where: { id: numericTaskId }});
        if (!taskToDelete) {
             res.status(404).json({ message: "Task not found" });
             return;
        }

        await Prisma.$transaction(async (tx) => {
            const deletionDate = new Date();
            const deleterId = loggedInUser.userId;

            // 1. Soft delete all comments associated with the task
            await tx.comment.updateMany({
                where: { taskId: numericTaskId },
                data: {
                    deletedAt: deletionDate,
                    deletedById: deleterId,
                },
            });

            // 2. Soft delete all attachments associated with the task
            await tx.attachment.updateMany({
                where: { taskId: numericTaskId },
                data: {
                    deletedAt: deletionDate,
                    deletedById: deleterId,
                },
            });

            // 3. Finally, soft delete the task itself
            await tx.task.update({
                where: { id: numericTaskId },
                data: {
                    deletedAt: deletionDate,
                    deletedById: deleterId,
                },
            });

            // Log the deletion activity
            await tx.activity.create({
                data: {
                    projectId: taskToDelete.projectId,
                    userId: loggedInUser.userId,
                    taskId: taskToDelete.id,
                    type: 'TASK_DELETED',
                    description: `deleted task "${taskToDelete.title}"`
                }
            });
        });

        broadcast({ type: 'UPDATE', projectId: taskToDelete.projectId });

        res.status(200).json({ message: `Task with ID ${taskId} and its content have been archived.` });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: `Error deleting task: ${error}` });
    }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.params;
    try {
        const task = await Prisma.task.findFirst({
            where: {
                id: Number(taskId),
                deletedAt: null,
            },
            include: {
                author: true,
                assignee: true,
                comments: {
                    where: { deletedAt: null },
                    include: { user: true },
                },
                attachments: {
                    where: { deletedAt: null },
                },
                timeLogs: { // <-- This was the missing piece
                    include: {
                        user: { select: { username: true } }
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        deletedAt: true
                    }
                }
            },
        });

        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ message: "Task not found." });
        }
    } catch (error) {
        res.status(500).json({ message: `Error retrieving task: ${error}` });
    }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const loggedInUser = req.user;

    // Explicitly pull only the fields we allow to be updated from the request body
    const { 
        title, 
        description, 
        status, 
        priority, 
        tags, 
        startDate, 
        dueDate, 
        points, 
        assignedUserId 
    } = req.body;

    try {
        const originalTask = await Prisma.task.findUnique({ where: { id: Number(taskId) } });

        if (!originalTask || !loggedInUser) {
            res.status(404).json({ message: "Task not found or user not authenticated." });
            return;
        }

        const dataToUpdate: any = {
            title,
            description,
            status,
            priority,
            tags,
            startDate: startDate ? new Date(startDate) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            points: points ? Number(points) : null,
            assignedUserId: assignedUserId ? Number(assignedUserId) : null,
            updatedById: loggedInUser?.userId, // Always stamp the updater
        };

        const updatedTask = await Prisma.task.update({
            where: { id: Number(taskId) },
            data: dataToUpdate,
            include: {
                author: true,
                assignee: true,
                comments: { where: { deletedAt: null } },
                attachments: { where: { deletedAt: null } },
                project: {
                    select: {
                        id: true,
                        name: true,
                        deletedAt: true
                    }
                }
            }
        });

        // Log the general update activity, unless it was just a status change
        if (originalTask.status === updatedTask.status) {
            await Prisma.activity.create({
                data: {
                    projectId: updatedTask.projectId,
                    userId: loggedInUser.userId,
                    taskId: updatedTask.id,
                    type: 'TASK_UPDATED',
                    description: `updated task "${updatedTask.title}"`
                }
            });
        }

        broadcast({ type: 'UPDATE', projectId: updatedTask.projectId });

        res.json(updatedTask);
    } catch (error: any) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
};

export const getTaskTimeLogs = async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.params;
    try {
        const timeLogs = await Prisma.timeLog.findMany({
            where: { 
                taskId: Number(taskId) 
            },
            include: {
                user: { // Include the user's name with each log
                    select: {
                        username: true
                    }
                }
            },
            orderBy: {
                startTime: 'desc' // Show the most recent logs first
            }
        });
        res.status(200).json(timeLogs);
    } catch (error: any) {
        res.status(500).json({ message: `Error retrieving time logs: ${error.message}` });
    }
};