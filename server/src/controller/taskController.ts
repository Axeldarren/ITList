import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response): Promise<void> => {
    const { projectId, version } = req.query;

    const whereClause: any = {
        deletedAt: null, // Only fetch tasks that are not deleted
    };

    if (projectId) {
        whereClause.projectId = Number(projectId);
        if (version) {
            whereClause.version = Number(version);
        }
    }

    try {
        const tasks = await Prisma.task.findMany({
            where: whereClause,
            include: {
                author: true,
                assignee: true,
                comments: { where: { deletedAt: null } },
                attachments: { where: { deletedAt: null } }
            }
        });
        res.json(tasks);
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
        });

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
        const updatedTask = await Prisma.task.update({
            where: { id: Number(taskId) },
            data: {
                status: status,
                updatedById: loggedInUser?.userId, // Also stamp the updater here
            }
        });
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: `Error updating task status: ${error}` });
    }
};

export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const tasks = await Prisma.task.findMany({
      where: {
        deletedAt: null, // Only fetch non-deleted tasks
        OR: [
          { authorUserId: Number(userId) },
          { assignedUserId: Number(userId) },
        ],
      },
      include: {
        author: true,
        assignee: true,
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
        });

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
                deletedAt: null, // Ensure the task itself isn't deleted
            },
            include: {
                author: true,
                assignee: true,
                comments: {
                    where: { deletedAt: null }, // Only include non-deleted comments
                    include: { user: true },
                },
                attachments: {
                    where: { deletedAt: null }, // Only include non-deleted attachments
                },
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
        });
        res.json(updatedTask);
    } catch (error: any) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
};