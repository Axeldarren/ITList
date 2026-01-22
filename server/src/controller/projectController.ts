import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";
import mysql from "mysql2/promise";

// Define ProjectStatus type based on allowed values
type ProjectStatus = "Start" | "OnProgress" | "Resolve" | "Finish" | "Cancel";

const Prisma = new PrismaClient();

// Helper: check if user is admin or a member of the project's team
async function userHasProjectAccess(
  user: any,
  projectId: number
): Promise<boolean> {
  if (user?.isAdmin) return true;
  if (!user?.userId) return false;
  const project = await Prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      projectTeams: {
        some: {
          team: {
            members: {
              some: { userId: user.userId },
            },
          },
        },
      },
    },
  });
  return !!project;
}

export const getProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // If user is not admin, limit to projects where the user's teams are attached
    const whereClause: any = { deletedAt: null };
    if (!req.user?.isAdmin && req.user?.userId) {
      whereClause.projectTeams = {
        some: {
          team: {
            members: {
              some: { userId: req.user.userId },
            },
          },
        },
      };
    }

    const projects = await Prisma.project.findMany({
      where: whereClause, // Only fetch active projects, and restrict for non-admins
      include: {
        projectTeams: { select: { teamId: true } },
        createdBy: { select: { username: true } }, // Include creator's name
        projectTicket: true,
      },
    });

    // Calculate total time logged for each project
    const projectsWithTimeData = await Promise.all(
      projects.map(async (project) => {
        return {
          ...project,
          teamId: project.projectTeams[0]?.teamId || null,
        };
      })
    );

    res.json(projectsWithTimeData);
  } catch (error) {
    res.status(500).json({ message: `Error retrieving projects: ${error}` });
  }
};

export const createProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, description, startDate, endDate, teamId, docUrl, ticket_id } =
    req.body;
  const loggedInUser = req.user;

  if (!teamId) {
    res
      .status(400)
      .json({ message: "A teamId is required to create a project." });
    return;
  }

  try {
    // Check if the ticket_id is already associated with another project
    if (ticket_id) {
      const existingTicket = await Prisma.projectTicket.findUnique({
        where: { ticket_id: ticket_id },
      });

      if (existingTicket) {
        res
          .status(400)
          .json({
            message:
              "This ticketId is already associated with another project.",
          });
        return;
      }
    }

    const newProject = await Prisma.project.create({
      data: {
        name,
        description,
        startDate,
        endDate,
  ...({ docUrl } as any),
        version: 1,
        status: "Start", // Default status
        createdById: loggedInUser?.userId,
        updatedById: loggedInUser?.userId, // Creator is also the first updater
        projectTeams: {
          create: { teamId: Number(teamId) },
        },
      },
    });

    // If ticketId is provided, create an entry in the ProjectTicket table
    if (ticket_id) {
      await Prisma.projectTicket.create({
        data: {
          ticket_id: ticket_id,
          projectId: newProject.id,
          version: 1, // Always 1 for new project
        },
      });
    }

    // Broadcast a general project update
    broadcast({ type: "PROJECT_UPDATE" });

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: `Error creating project: ${error}` });
  }
};

export const incrementProjectVersion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;

  try {
    const updatedProject = await Prisma.project.update({
      where: {
        id: Number(projectId),
      },
      data: {
        version: {
          increment: 1,
        },
      },
    });

    res.status(200).json(updatedProject);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error updating project version: ${error}` });
  }
};

export const getProjectUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const numericProjectId = Number(projectId);

  if (isNaN(numericProjectId)) {
    res.status(400).json({ message: "Invalid project ID." });
    return;
  }

  // Access control: 404 if not allowed
  if (!(await userHasProjectAccess(req.user, numericProjectId))) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  try {
    const projectTeam = await Prisma.projectTeam.findFirst({
      where: { projectId: numericProjectId },
      select: { teamId: true },
    });

    if (!projectTeam) {
      res.json([]);
      return;
    }

    const memberships = await Prisma.teamMembership.findMany({
      where: {
        teamId: projectTeam.teamId,
        user: {
          deletedAt: null,
        },
      },
      include: { user: true },
    });

    const users = memberships.map((membership) => membership.user);

    res.json(users);
  } catch (error) {
    console.error(
      `Error retrieving project users for projectId ${projectId}:`,
      error
    );
    res
      .status(500)
      .json({ message: `Error retrieving project users: ${error}` });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const loggedInUser = req.user;
  const numericProjectId = Number(projectId);

  if (!loggedInUser) {
    res.status(401).json({ message: "Not authorized." });
    return;
  }

  try {
    await Prisma.$transaction(async (tx) => {
      const deletionDate = new Date();
      const deleterId = loggedInUser.userId;

      const tasksToDelete = await tx.task.findMany({
        where: { projectId: numericProjectId },
        select: { id: true },
      });
      const taskIdsToDelete = tasksToDelete.map((task) => task.id);

      if (taskIdsToDelete.length > 0) {
        // Soft delete all comments and attachments related to the tasks
        await tx.comment.updateMany({
          where: { taskId: { in: taskIdsToDelete } },
          data: { deletedAt: deletionDate, deletedById: deleterId },
        });

        // --- NEW: Soft delete attachments ---
        await tx.attachment.updateMany({
          where: { taskId: { in: taskIdsToDelete } },
          data: { deletedAt: deletionDate, deletedById: deleterId },
        });

        // Hard delete the join table records
        await tx.taskAssignment.deleteMany({
          where: { taskId: { in: taskIdsToDelete } },
        });

        // Soft delete all tasks
        await tx.task.updateMany({
          where: { id: { in: taskIdsToDelete } },
          data: { deletedAt: deletionDate, deletedById: deleterId },
        });
      }

      // Hard delete project-specific join/history tables
      await tx.projectTeam.deleteMany({
        where: { projectId: numericProjectId },
      });
      await tx.projectStatusHistory.deleteMany({
        where: { projectId: numericProjectId },
      });
      await tx.projectVersion.deleteMany({
        where: { projectId: numericProjectId },
      });

      // Hard delete the associated ProjectTicket
      await tx.projectTicket.deleteMany({
        where: { projectId: numericProjectId },
      });

      // Soft delete the project itself
      await tx.project.update({
        where: { id: numericProjectId },
        data: { deletedAt: deletionDate, deletedById: deleterId },
      });
    });

    broadcast({ type: "PROJECT_UPDATE" });

    res
      .status(200)
      .json({
        message:
          "Project and all its related data have been successfully archived.",
      });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: `Error deleting project` });
  }
};

export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const { name, description, startDate, endDate, teamId, docUrl, ticket_id } =
    req.body;
  const loggedInUser = req.user;
  const numericProjectId = Number(projectId);

  // Access control: 404 if not allowed
  if (!(await userHasProjectAccess(loggedInUser, numericProjectId))) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  try {
    await Prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: numericProjectId },
        data: {
          name,
          description,
          startDate,
          endDate,
          ...({ docUrl } as any),
          updatedById: loggedInUser?.userId,
        },
      });

      if (teamId) {
        await tx.projectTeam.updateMany({
          where: { projectId: numericProjectId },
          data: { teamId: Number(teamId) },
        });
      }

      if (ticket_id) {
        // Get the current project version
        const project = await tx.project.findUnique({ where: { id: numericProjectId } });
        const currentVersion = project?.version ?? 1;

        // Check for duplicate ticket in this version, excluding current project
        const duplicate = await tx.projectTicket.findFirst({
          where: {
            ticket_id: ticket_id,
            version: currentVersion,
            projectId: { not: numericProjectId }
          },
        });
        if (duplicate) {
          throw new Error("This ticket is already associated with another project version.");
        }

        // Upsert ticket for this version
        await tx.projectTicket.upsert({
          where: {
            projectId_version: {
              projectId: numericProjectId,
              version: currentVersion,
            },
          },
          update: { ticket_id: ticket_id },
          create: {
            projectId: numericProjectId,
            version: currentVersion,
            ticket_id: ticket_id,
          },
        });
      }

      // Broadcast an update for this specific project
      broadcast({ type: "PROJECT_UPDATE", projectId: numericProjectId });

      // Fetch the updated project with its ticket
      const updatedProjectWithTicket = await tx.project.findUnique({
        where: { id: numericProjectId },
        include: {
          projectTicket: true
        }
      });
      res.status(200).json(updatedProjectWithTicket);
    });
  } catch (error: any) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: `Error updating project: ${error.message}` });
  }
};

export const updateProjectStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const { status } = req.body as { status: ProjectStatus };
  const loggedInUser = req.user;
  const numericProjectId = Number(projectId);

  if (!loggedInUser) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }

  // Access control: 404 if not allowed
  if (!(await userHasProjectAccess(loggedInUser, numericProjectId))) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  try {
    const project = await Prisma.project.findUnique({
      where: { id: numericProjectId },
    });

    if (!project || project.deletedAt) {
      res.status(404).json({ message: "Project not found." });
      return;
    }

    const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      Start: ["OnProgress", "Cancel"],
      OnProgress: ["Resolve", "Cancel"],
      Resolve: ["OnProgress", "Finish", "Cancel"],
      Finish: [],
      Cancel: [],
    };

    if (!allowedTransitions[project.status].includes(status)) {
      res
        .status(400)
        .json({
          message: `Cannot transition from '${project.status}' to '${status}'.`,
        });
      return;
    }

    // --- THIS IS THE FIX ---
    // Add a specific check before allowing the 'Finish' status.
    if (status === "Finish") {
      const activeTasks = await Prisma.task.findMany({
        where: {
          projectId: numericProjectId,
          version: project.version, // Only check tasks for the current version
          deletedAt: null,
        },
      });

      const allTasksCompleted = activeTasks.every(
        (task) => task.status === "Completed"
      );

      if (!allTasksCompleted) {
        // This is the error message you were seeing.
        res
          .status(400)
          .json({
            message:
              "All tasks for the current version must be completed before a project can be finished.",
          });
        return;
      }
    }
    // --- End of Fix ---

    await Prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: numericProjectId },
        data: {
          status: status,
          updatedById: loggedInUser.userId,
        },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId: numericProjectId,
          status: status,
          changedById: loggedInUser.userId,
        },
      });
    });

    broadcast({ type: "PROJECT_UPDATE", projectId: numericProjectId });

    res.status(200).json({ message: `Project status updated to ${status}` });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ message: `Error updating project status` });
  }
};

export const archiveAndIncrementVersion = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ... (parameter extraction and validation)
  const { projectId } = req.params;
  const { startDate, endDate } = req.body;
  const loggedInUser = req.user;
  const numericProjectId = Number(projectId);

  if (!startDate || !endDate) {
    /* ... */
  }

  // Access control: 404 if not allowed
  if (!(await userHasProjectAccess(loggedInUser, numericProjectId))) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  try {
    await Prisma.$transaction(async (tx) => {
      const currentProject = await tx.project.findUnique({
        where: { id: numericProjectId },
      });

      if (
        !currentProject ||
        !currentProject.version ||
        !currentProject.startDate
      ) {
        res
          .status(404)
          .json({ message: "Project or its version/dates not found." });
        return;
      }

      // 1. Archive the current version with its final status
      await tx.projectVersion.create({
        data: {
          projectId: currentProject.id,
          version: currentProject.version,
          name: currentProject.name,
          description: currentProject.description,
          startDate: currentProject.startDate,
          endDate: new Date(),
          status: currentProject.status,
        },
      });

      // 2. Increment the version and reset the project
      await tx.project.update({
        where: { id: numericProjectId },
        data: {
          version: { increment: 1 },
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "Start",
          updatedById: loggedInUser?.userId,
        },
      });

      // 3. Archive old tasks
      await tx.task.updateMany({
        where: {
          projectId: numericProjectId,
          version: currentProject.version,
        },
        data: { status: "Archived" },
      });

      broadcast({ type: "PROJECT_UPDATE", projectId: numericProjectId });

      res.status(200).json({ message: "New version created successfully" });
    });
  } catch (error) {
    console.error("Error archiving project version:", error);
    res.status(500).json({ message: `Error archiving project version` });
  }
};

export const getProjectVersionHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const numericProjectId = Number(projectId);

  // Access control: 404 if not allowed
  if (!(await userHasProjectAccess(req.user, numericProjectId))) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  try {
    const { page, limit } = req.query;
    const whereClause = { projectId: numericProjectId };

    if (page && limit) {
         const pageNumber = Number(page);
         const limitNumber = Number(limit);
         const skip = (pageNumber - 1) * limitNumber;

         const totalVersions = await Prisma.projectVersion.count({ where: whereClause });
         const totalPages = Math.ceil(totalVersions / limitNumber);

         const versions = await Prisma.projectVersion.findMany({
            where: whereClause,
            skip,
            take: limitNumber,
            orderBy: { version: "desc" },
         });

         res.json({
             data: versions,
             meta: {
                 totalVersions,
                 page: pageNumber,
                 limit: limitNumber,
                 totalPages
             }
         });
    } else {
        const versions = await Prisma.projectVersion.findMany({
            where: whereClause,
            orderBy: { version: "desc" },
        });
        res.json(versions);
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error retrieving project version history: ${error}` });
  }
};

export const getAllProjectVersions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const versions = await Prisma.projectVersion.findMany({
      // Order them to make the timeline consistent
      orderBy: [
        {
          projectId: "asc",
        },
        {
          version: "asc",
        },
      ],
    });
    res.json(versions);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error retrieving all project versions: ${error}` });
  }
};

export const getProjectActivities = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const { page, limit, search } = req.query;
  const numericProjectId = Number(projectId);

  // Access control: 404 if not allowed
  if (!(await userHasProjectAccess(req.user, numericProjectId))) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  try {
    const { startDate, endDate } = req.query;
    const whereClause: any = { projectId: numericProjectId };
    const searchQuery = String(search || '').trim();
    if (searchQuery) {
        whereClause.OR = [
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { task: { title: { contains: searchQuery, mode: 'insensitive' } } },
            { user: { username: { contains: searchQuery, mode: 'insensitive' } } }
        ];
    }

    if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
            whereClause.createdAt.gte = new Date(String(startDate));
        }
        if (endDate) {
            // Set endDate to end of the day to ensure we capture activities ON that day
            const end = new Date(String(endDate));
            end.setHours(23, 59, 59, 999);
            whereClause.createdAt.lte = end;
        }
    }

    if (page && limit) {
         const pageNumber = Number(page);
         const limitNumber = Number(limit);
         const skip = (pageNumber - 1) * limitNumber;

         const totalActivities = await Prisma.activity.count({ where: whereClause });
         const totalPages = Math.ceil(totalActivities / limitNumber);

         const activities = await Prisma.activity.findMany({
            where: whereClause,
            skip,
            take: limitNumber,
            include: {
                user: { select: { username: true, profilePictureUrl: true } },
                task: { select: { title: true } },
            },
            orderBy: {
                createdAt: "desc",
            },
         });

         res.json({
             data: activities,
             meta: {
                 totalActivities,
                 page: pageNumber,
                 limit: limitNumber,
                 totalPages
             }
         });
    } else {
        const activities = await Prisma.activity.findMany({
            where: whereClause,
            include: {
                user: { select: { username: true, profilePictureUrl: true } },
                task: { select: { title: true } },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(activities);
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error retrieving project activities: ${error}` });
  }
};

export const getTimelineProjects = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search = '', status = 'all', sort = 'oldest' } = req.query;
    
    try {
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const searchQuery = String(search).trim();
        const statusFilter = String(status);
        const sortOption = String(sort);
        const skip = (pageNumber - 1) * limitNumber;

        // Build where clause
        const whereClause: any = {
            deletedAt: null,
        };

        // Access control for non-admins
        if (!req.user?.isAdmin && req.user?.userId) {
            whereClause.projectTeams = {
                some: {
                    team: {
                        members: {
                            some: { userId: req.user.userId },
                        },
                    },
                },
            };
        }

        if (searchQuery) {
            whereClause.OR = [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } }
            ];
        }

        // Apply Status Filter
        if (statusFilter && statusFilter !== 'all') {
            whereClause.status = statusFilter;
        }

        // Determine Order By
        let orderBy: any = { startDate: 'asc' }; // Default 'oldest'

        switch (sortOption) {
            case 'newest':
                orderBy = { startDate: 'desc' };
                break;
            case 'oldest':
                orderBy = { startDate: 'asc' };
                break;
            case 'a-z':
                orderBy = { name: 'asc' };
                break;
            case 'z-a':
                orderBy = { name: 'desc' };
                break;
            default:
                orderBy = { startDate: 'asc' };
        }

        // Get total count
        const totalProjects = await Prisma.project.count({ where: whereClause });
        const totalPages = Math.ceil(totalProjects / limitNumber);

        // Fetch projects with versions directly
        const projects = await Prisma.project.findMany({
            where: whereClause,
            skip,
            take: limitNumber,
            orderBy: orderBy,
            include: {
                versions: {
                    orderBy: {
                        version: 'asc'
                    }
                },
                createdBy: {
                    select: {
                        username: true
                    }
                },
                projectTeams: {
                    include: {
                        team: true
                    }
                }
            }
        });

        res.json({
            data: projects,
            meta: {
                totalProjects,
                page: pageNumber,
                limit: limitNumber,
                totalPages
            }
        });

    } catch (error) {
        console.error("Error fetching timeline projects:", error);
        res.status(500).json({ message: `Error fetching timeline projects: ${error}` });
    }
};
