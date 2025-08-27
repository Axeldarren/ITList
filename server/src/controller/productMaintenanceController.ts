import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";

const prisma = new PrismaClient();

export const getProductMaintenances = async (req: Request, res: Response): Promise<void> => {
  try {
    const productMaintenances = await prisma.productMaintenance.findMany({
      where: {
        deletedAt: null, // Only get non-deleted records
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        maintainers: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                profilePictureUrl: true,
                email: true,
              },
            },
          },
        },
        maintenanceTasks: {
          include: {
            assignedTo: {
              select: {
                userId: true,
                username: true,
                profilePictureUrl: true,
              },
            },
            timeLogs: {
              where: {
                endTime: { not: null }, // Only completed time logs
              },
            },
            maintenanceTaskTicket: true,
          },
        },
        _count: {
          select: {
            maintenanceTasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate total time logged for each product maintenance
    const productMaintenancesWithTotals = productMaintenances.map(pm => {
      const totalTimeLogged = pm.maintenanceTasks.reduce((total, task) => {
        const taskTime = task.timeLogs.reduce((taskTotal, log) => {
          return taskTotal + (log.duration || 0);
        }, 0);
        return total + taskTime;
      }, 0);

      // Also calculate total time for each maintenance task
      const maintenanceTasksWithTotals = pm.maintenanceTasks.map(task => ({
        ...task,
        totalTimeLogged: task.timeLogs.reduce((total, log) => total + (log.duration || 0), 0),
      }));

      return {
        ...pm,
        totalTimeLogged,
        maintenanceTasks: maintenanceTasksWithTotals,
      };
    });

    res.json(productMaintenancesWithTotals);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving product maintenances: ${error.message}` });
  }
};

export const getProductMaintenanceById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const productMaintenance = await prisma.productMaintenance.findUnique({
      where: { 
        id: Number(id),
        deletedAt: null,
      },
  include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        maintainers: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                profilePictureUrl: true,
                email: true,
              },
            },
          },
        },
  maintenanceTasks: {
          include: {
            assignedTo: {
              select: {
                userId: true,
                username: true,
                profilePictureUrl: true,
              },
            },
            createdBy: {
              select: {
                userId: true,
                username: true,
                profilePictureUrl: true,
              },
            },
            timeLogs: {
              where: {
                endTime: { not: null }, // Only completed time logs
              },
            },
            maintenanceTaskTicket: true,
          },
          orderBy: {
            createdAt: "desc",
          },
  }
      },
    });

    if (!productMaintenance) {
      res.status(404).json({ message: "Product maintenance not found" });
      return;
    }

    // Calculate total time logged for the product maintenance
    const totalTimeLogged = productMaintenance.maintenanceTasks.reduce((total, task) => {
      const taskTime = task.timeLogs.reduce((taskTotal, log) => {
        return taskTotal + (log.duration || 0);
      }, 0);
      return total + taskTime;
    }, 0);

    // Also calculate total time for each maintenance task
    const maintenanceTasksWithTotals = productMaintenance.maintenanceTasks.map(task => ({
      ...task,
      totalTimeLogged: task.timeLogs.reduce((total, log) => total + (log.duration || 0), 0),
    }));

    const productMaintenanceWithTotals = {
      ...productMaintenance,
      totalTimeLogged,
      maintenanceTasks: maintenanceTasksWithTotals,
    };

    res.json(productMaintenanceWithTotals);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving product maintenance: ${error.message}` });
  }
};

// Update lifecycle (Planned -> Maintaining -> Finished)
export const updateMaintenanceLifecycle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { lifecycle } = req.body as { lifecycle: 'Planned' | 'Maintaining' | 'Finished' };
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  if (!['Planned', 'Maintaining', 'Finished'].includes(String(lifecycle))) {
    res.status(400).json({ message: "Invalid lifecycle value" });
    return;
  }

  try {
  const pm = await prisma.productMaintenance.findFirst({ where: { id: Number(id), deletedAt: null } });
    if (!pm) {
      res.status(404).json({ message: "Product maintenance not found" });
      return;
    }

    // Allowed transitions
    const allowed: Record<string, string[]> = {
      Planned: ['Maintaining'],
      Maintaining: ['Finished'],
      Finished: ['Maintaining'], // allow re-open
    };

  if (!allowed[(pm as any).lifecycle]?.includes(lifecycle)) {
  res.status(400).json({ message: `Cannot transition from '${(pm as any).lifecycle}' to '${lifecycle}'.` });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPm = await tx.productMaintenance.update({
        where: { id: Number(id) },
        data: { ...( { lifecycle } as any ), updatedById: userId },
      });
      await (tx as any).productMaintenanceStatusHistory.create({
        data: {
          productMaintenanceId: Number(id),
          status: lifecycle as any,
          changedById: userId,
        }
      });
      return updatedPm;
    });

    broadcast({ type: 'PRODUCT_MAINTENANCE_UPDATE', action: 'lifecycle', productMaintenanceId: Number(id), data: updated });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating maintenance lifecycle: ${error.message}` });
  }
};

export const createProductMaintenance = async (req: Request, res: Response): Promise<void> => {
  const { name, description, priority, projectId, maintainerIds = [] } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  try {
    const productMaintenance = await prisma.productMaintenance.create({
      data: {
        name,
        description,
        priority: priority || "Medium",
        projectId: projectId ? Number(projectId) : null,
        createdById: userId,
        maintainers: {
          create: maintainerIds.map((maintainerId: number) => ({
            userId: maintainerId,
          })),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        maintainers: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                profilePictureUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Broadcast product maintenance creation
    broadcast({
      type: 'PRODUCT_MAINTENANCE_UPDATE',
      action: 'created',
      productMaintenanceId: productMaintenance.id,
      data: productMaintenance,
    });

    res.status(201).json(productMaintenance);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating product maintenance: ${error.message}` });
  }
};

export const updateProductMaintenance = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, status, priority, maintainerIds } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  try {
    // Update the product maintenance
    const updateData: any = {
      updatedById: userId,
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    const productMaintenance = await prisma.productMaintenance.update({
      where: { 
        id: Number(id),
        deletedAt: null,
      },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        maintainers: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                profilePictureUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update maintainers if provided
    if (maintainerIds !== undefined) {
      // Remove existing maintainers
      await prisma.productMaintainer.deleteMany({
        where: {
          productMaintenanceId: Number(id),
        },
      });

      // Add new maintainers
      if (maintainerIds.length > 0) {
        await prisma.productMaintainer.createMany({
          data: maintainerIds.map((maintainerId: number) => ({
            productMaintenanceId: Number(id),
            userId: maintainerId,
          })),
        });
      }
    }

    // Broadcast product maintenance update
    broadcast({
      type: 'PRODUCT_MAINTENANCE_UPDATE',
      action: 'updated',
      productMaintenanceId: Number(id),
      data: productMaintenance,
    });

    res.json(productMaintenance);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating product maintenance: ${error.message}` });
  }
};

export const deleteProductMaintenance = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  try {
    await prisma.productMaintenance.update({
      where: { 
        id: Number(id),
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Broadcast product maintenance deletion
    broadcast({
      type: 'PRODUCT_MAINTENANCE_UPDATE',
      action: 'deleted',
      productMaintenanceId: Number(id),
    });

    res.json({ message: "Product maintenance deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting product maintenance: ${error.message}` });
  }
};

export const createMaintenanceTask = async (req: Request, res: Response): Promise<void> => {
  const { productMaintenanceId } = req.params;
  const { title, description, priority, type, estimatedHours, assignedToId, ticket_id } = req.body;
  const userId = req.user?.userId;
  const isAdmin = req.user?.isAdmin; // Get isAdmin status from the authenticated user

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  // Ticket ID is required for non-admins
  if (!isAdmin && !ticket_id) {
    res.status(400).json({ message: "Ticket is required for this task." });
    return;
  }

  try {
    // Check if the ticketId is already associated with another maintenance task
    if (ticket_id) {
      const existingTicket = await prisma.maintenanceTaskTicket.findUnique({
        where: { ticket_id: ticket_id },
      });

      if (existingTicket) {
        res.status(400).json({ message: "This ticketId is already associated with another maintenance task." });
        return;
      }
    }

    const maintenanceTask = await prisma.maintenanceTask.create({
      data: {
        title,
        description,
        priority: priority || "Medium",
        type: type || "General",
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        assignedToId: assignedToId ? Number(assignedToId) : null,
        productMaintenanceId: Number(productMaintenanceId),
        createdById: userId,
      },
      include: {
        assignedTo: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        createdBy: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // If ticket_id is provided, create an entry in the MaintenanceTaskTicket table
    if (ticket_id) {
      await prisma.maintenanceTaskTicket.create({
        data: {
          ticket_id: ticket_id,
          maintenanceTaskId: maintenanceTask.id,
        },
      });
    }

    // Broadcast maintenance task creation
    broadcast({
      type: 'MAINTENANCE_TASK_UPDATE',
      action: 'created',
      taskId: maintenanceTask.id,
      productMaintenanceId: Number(productMaintenanceId),
      data: maintenanceTask,
    });

    res.status(201).json(maintenanceTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating maintenance task: ${error.message}` });
  }
};

export const updateMaintenanceTask = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, priority, type, estimatedHours, actualHours, assignedToId, ticket_id } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  try {
    const updateData: any = {
      updatedById: userId,
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (type !== undefined) updateData.type = type;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? Number(estimatedHours) : null;
    if (actualHours !== undefined) updateData.actualHours = actualHours ? Number(actualHours) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId ? Number(assignedToId) : null;

    const maintenanceTask = await prisma.maintenanceTask.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        createdBy: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Ticket logic: upsert or create if not exists, prevent duplicate
    if (ticket_id) {
      // Check for duplicate ticket
      const duplicate = await prisma.maintenanceTaskTicket.findFirst({
        where: {
          ticket_id: ticket_id,
        },
      });
      if (duplicate && duplicate.maintenanceTaskId !== Number(id)) {
        throw new Error("This ticket is already associated with another maintenance task.");
      }

      // Upsert ticket for this maintenance task
      await prisma.maintenanceTaskTicket.upsert({
        where: {
          maintenanceTaskId: Number(id),
        },
        update: { ticket_id: ticket_id },
        create: {
          maintenanceTaskId: Number(id),
          ticket_id: ticket_id,
        },
      });
    }

    // Broadcast maintenance task update
    broadcast({
      type: 'MAINTENANCE_TASK_UPDATE',
      action: 'updated',
      taskId: maintenanceTask.id,
      productMaintenanceId: maintenanceTask.productMaintenanceId,
      data: maintenanceTask,
    });

    res.json(maintenanceTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating maintenance task: ${error.message}` });
  }
};

export const deleteMaintenanceTask = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Get the task info before deleting for broadcasting
    const taskToDelete = await prisma.maintenanceTask.findUnique({
      where: { id: Number(id) },
      select: { id: true, productMaintenanceId: true },
    });

    if (!taskToDelete) {
      res.status(404).json({ message: "Maintenance task not found" });
      return;
    }

    await prisma.maintenanceTask.delete({
      where: { id: Number(id) },
    });

    // Broadcast maintenance task deletion
    broadcast({
      type: 'MAINTENANCE_TASK_UPDATE',
      action: 'deleted',
      taskId: Number(id),
      productMaintenanceId: taskToDelete.productMaintenanceId,
    });

    res.json({ message: "Maintenance task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting maintenance task: ${error.message}` });
  }
};

export const getFinishedProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const finishedProjects = await prisma.project.findMany({
      where: {
        status: "Finish",
        deletedAt: null,
        ...(req.user?.isAdmin
          ? {}
          : {
              projectTeams: {
                some: {
                  team: {
                    members: {
                      some: { userId: req.user?.userId }
                    }
                  }
                }
              }
            })
      },
      select: {
        id: true,
        name: true,
        description: true,
        endDate: true,
        status: true,
      },
      orderBy: {
        endDate: "desc",
      },
    });

    res.json(finishedProjects);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving finished projects: ${error.message}` });
  }
};

// ===== MAINTENANCE TIME LOG FUNCTIONS =====

export const getMaintenanceTimeLogs = async (req: Request, res: Response): Promise<void> => {
  const { productMaintenanceId } = req.params;
  try {
    // Get all maintenance tasks for this product maintenance
    const maintenanceTasks = await prisma.maintenanceTask.findMany({
      where: {
        productMaintenanceId: Number(productMaintenanceId),
      },
      select: {
        id: true,
      },
    });

    const maintenanceTaskIds = maintenanceTasks.map(task => task.id);

    // Get time logs for all maintenance tasks using the unified system
    const timeLogs = await prisma.timeLog.findMany({
      where: {
        maintenanceTaskId: {
          in: maintenanceTaskIds,
        },
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        maintenanceTask: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    res.json(timeLogs);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving maintenance time logs: ${error.message}` });
  }
};

export const startMaintenanceTimeLog = async (req: Request, res: Response): Promise<void> => {
  const { productMaintenanceId } = req.params;
  const { description, maintenanceTaskId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  if (!maintenanceTaskId) {
    res.status(400).json({ message: "Maintenance task ID is required for the unified timer system" });
    return;
  }

  try {
    // Check if user has an active timer for any task/maintenance using unified system
    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId: userId,
        endTime: null, // Still running
      },
    });

    if (activeTimer) {
      res.status(400).json({ message: "You already have an active timer running. Please stop it first." });
      return;
    }

    // Verify the maintenance task belongs to this product maintenance
    const maintenanceTask = await prisma.maintenanceTask.findFirst({
      where: {
        id: Number(maintenanceTaskId),
        productMaintenanceId: Number(productMaintenanceId),
      },
    });

    if (!maintenanceTask) {
      res.status(404).json({ message: "Maintenance task not found or doesn't belong to this product maintenance" });
      return;
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        startTime: new Date(),
        description: description || "Working on maintenance task",
        maintenanceTaskId: Number(maintenanceTaskId),
        userId: userId,
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        maintenanceTask: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Broadcast time log start
    broadcast({
      type: 'MAINTENANCE_TIME_LOG_UPDATE',
      action: 'started',
      productMaintenanceId: Number(productMaintenanceId),
      data: timeLog,
    });

    res.status(201).json(timeLog);
  } catch (error: any) {
    res.status(500).json({ message: `Error starting maintenance time log: ${error.message}` });
  }
};

export const stopMaintenanceTimeLog = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // This would be the timeLogId in the unified system
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  try {
    // Find the time log using unified system
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: Number(id) },
      include: {
        maintenanceTask: {
          select: {
            id: true,
            title: true,
            productMaintenanceId: true,
          },
        },
      },
    });

    if (!timeLog) {
      res.status(404).json({ message: "Time log not found" });
      return;
    }

    if (timeLog.userId !== userId) {
      res.status(403).json({ message: "You can only stop your own time logs" });
      return;
    }

    if (timeLog.endTime) {
      res.status(400).json({ message: "Time log has already been stopped" });
      return;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timeLog.startTime.getTime()) / 1000);

    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: Number(id) },
      data: {
        endTime,
        duration,
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        maintenanceTask: {
          select: {
            id: true,
            title: true,
            productMaintenanceId: true,
          },
        },
      },
    });

    // Broadcast time log stop
    broadcast({
      type: 'MAINTENANCE_TIME_LOG_UPDATE',
      action: 'stopped',
      productMaintenanceId: timeLog.maintenanceTask?.productMaintenanceId,
      data: updatedTimeLog,
    });

    res.json(updatedTimeLog);
  } catch (error: any) {
    res.status(500).json({ message: `Error stopping maintenance time log: ${error.message}` });
  }
};

export const deleteMaintenanceTimeLog = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // This would be the timeLogId in the unified system
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  try {
    // Find the time log using unified system
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: Number(id) },
      include: {
        maintenanceTask: {
          select: {
            productMaintenanceId: true,
          },
        },
      },
    });

    if (!timeLog) {
      res.status(404).json({ message: "Time log not found" });
      return;
    }

    if (timeLog.userId !== userId) {
      res.status(403).json({ message: "You can only delete your own time logs" });
      return;
    }

    await prisma.timeLog.delete({
      where: { id: Number(id) },
    });

    // Broadcast time log deletion
    broadcast({
      type: 'MAINTENANCE_TIME_LOG_UPDATE',
      action: 'deleted',
      productMaintenanceId: timeLog.maintenanceTask?.productMaintenanceId,
      timeLogId: Number(id),
    });

    res.json({ message: "Time log deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting maintenance time log: ${error.message}` });
  }
};

// ==================== UNIFIED TIMER SYSTEM ====================
// New endpoints that use the unified TimeLog system

export const getMaintenanceTaskTimeLogs = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceTaskId } = req.params;

  try {
    const timeLogs = await prisma.timeLog.findMany({
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
        startTime: 'desc',
      },
    });

    res.json(timeLogs);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching maintenance task time logs: ${error.message}` });
  }
};

export const startMaintenanceTaskTimer = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceTaskId } = req.params;
  const { description } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  try {
    // Check if user has an active timer for any task/maintenance
    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId: userId,
        endTime: null, // Still running
      },
    });

    if (activeTimer) {
      res.status(400).json({ message: "You already have an active timer running. Please stop it first." });
      return;
    }

    // Get maintenance task to find productMaintenanceId
    const maintenanceTask = await prisma.maintenanceTask.findUnique({
      where: { id: Number(maintenanceTaskId) },
      select: { productMaintenanceId: true, title: true },
    });

    if (!maintenanceTask) {
      res.status(404).json({ message: "Maintenance task not found" });
      return;
    }

    // Create new time log
    const timeLog = await prisma.timeLog.create({
      data: {
        startTime: new Date(),
        description: description || "Working on maintenance task",
        maintenanceTaskId: Number(maintenanceTaskId),
        userId: userId,
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
    });

    // Broadcast timer start
    broadcast({
      type: 'MAINTENANCE_TIME_LOG_UPDATE',
      action: 'started',
      productMaintenanceId: maintenanceTask.productMaintenanceId,
      maintenanceTaskId: Number(maintenanceTaskId),
      timeLogId: timeLog.id,
      userId: userId,
    });

    res.status(201).json(timeLog);
  } catch (error: any) {
    res.status(500).json({ message: `Error starting maintenance timer: ${error.message}` });
  }
};

export const stopMaintenanceTaskTimer = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceTaskId } = req.params;
  const { workDescription } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }

  if (!workDescription || workDescription.trim().length === 0) {
    res.status(400).json({ message: "Work description is required" });
    return;
  }

  try {
    // Find the active timer for this user and maintenance task
    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId: userId,
        maintenanceTaskId: Number(maintenanceTaskId),
        endTime: null,
      },
    });

    if (!activeTimer) {
      res.status(404).json({ message: "No active timer found for this maintenance task" });
      return;
    }

    // Get maintenance task to find productMaintenanceId
    const maintenanceTask = await prisma.maintenanceTask.findUnique({
      where: { id: Number(maintenanceTaskId) },
      select: { productMaintenanceId: true, title: true },
    });

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);

    // Update the time log with end time
    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: activeTimer.id },
      data: {
        endTime: endTime,
        duration: duration,
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
    });

    // Create a comment with the work description
    const comment = await prisma.comment.create({
      data: {
        text: workDescription,
        maintenanceTaskId: Number(maintenanceTaskId),
        userId: userId,
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
    });

    // Link the comment to the time log
    await prisma.timeLog.update({
      where: { id: activeTimer.id },
      data: {
        commentId: comment.id,
      },
    });

    // Broadcast timer stop
    broadcast({
      type: 'MAINTENANCE_TIME_LOG_UPDATE',
      action: 'stopped',
      productMaintenanceId: maintenanceTask?.productMaintenanceId,
      maintenanceTaskId: Number(maintenanceTaskId),
      timeLogId: activeTimer.id,
      userId: userId,
    });

    // Broadcast comment creation
    broadcast({
      type: 'MAINTENANCE_COMMENT_ADDED',
      productMaintenanceId: maintenanceTask?.productMaintenanceId,
      maintenanceTaskId: Number(maintenanceTaskId),
      comment: comment,
    });

    res.json({ timeLog: updatedTimeLog, comment });
  } catch (error: any) {
    res.status(500).json({ message: `Error stopping maintenance timer: ${error.message}` });
  }
};
