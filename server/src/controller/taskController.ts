import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

export const getTasks = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { projectId } = req.query;
    try {
        const tasks = await Prisma.task.findMany({
            where: {
                projectId: Number(projectId),
            },
            include: {
                author: true,
                assignee: true,
                comments: true,
                attachments: true
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error}` });
    }
};

export const createTask = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        title,
        description,
        status,
        priority,
        tags,
        startDate,
        dueDate,
        points,
        projectId,
        authorUserId,
        assignedUserId,
    } = req.body;

    if (!projectId) {
        res.status(400).json({ message: "A projectId is required." });
        return;
    }

    try {
        const project = await Prisma.project.findUnique({
            where: {
                id: Number(projectId),
            },
        });

        if (!project) {
            res.status(404).json({ message: `Project with ID ${projectId} not found.` });
            return;
        }

        const projectVersion = project.version;

        const newTask = await Prisma.task.create({
            data: {
                title,
                description,
                status,
                priority,
                tags,
                startDate,
                dueDate,
                points,
                projectId: Number(projectId),
                authorUserId,
                assignedUserId,
                version: projectVersion
            },
        });

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: `Error creating task: ${error}` });
    }
}

export const updateTaskStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { taskId } = req.params;
    const { status } = req.body;
    try {
        const updatedTask = await Prisma.task.update({
            where: {
                id: Number(taskId),
            },
            data: {
                status: status,
            }
        });

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: `Error updating task status: ${error}` });
    }
};

export const getUserTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  try {
    const tasks = await Prisma.task.findMany({
      where: {
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
    res
      .status(500)
      .json({ message: `Error retrieving user's tasks: ${error.message}` });
  }
};

export const deleteTask = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { taskId } = req.params;
    try {
        await Prisma.$transaction([
            Prisma.comment.deleteMany({ where: { taskId: Number(taskId) } }),
            Prisma.attachment.deleteMany({ where: { taskId: Number(taskId) } }),
            Prisma.taskAssignment.deleteMany({ where: { taskId: Number(taskId) } }),
            Prisma.task.delete({ where: { id: Number(taskId) } }),
        ]);
        res.status(200).json({ message: `Task with ID ${taskId} deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: `Error deleting task: ${error}` });
    }
};

export const getTaskById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { taskId } = req.params;
    try {
        const task = await Prisma.task.findUnique({
            where: {
                id: Number(taskId),
            },
            include: {
                author: true,
                assignee: true,
                comments: {
                    include: {
                        user: true, // Also include user details for comments
                    },
                },
                attachments: true,
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
    const {
        title,
        description,
        status,
        priority,
        tags,
        startDate, 
        dueDate, 
        points,
        assignedUserId,
    } = req.body;

    try {
        // --- FIX: Convert date strings to Date objects if they exist ---
        const data: any = {
            title,
            description,
            status,
            priority,
            tags,
            points: Number(points) || null, // Ensure points is a number or null
            assignedUserId: assignedUserId ? Number(assignedUserId) : null,
        };

        if (startDate) {
            data.startDate = new Date(startDate);
        }
        if (dueDate) {
            data.dueDate = new Date(dueDate);
        }
        
        const updatedTask = await Prisma.task.update({
            where: { id: Number(taskId) },
            data, // Use the corrected data object
        });

        res.json(updatedTask);
    } catch (error: any) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
};