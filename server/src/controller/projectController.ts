import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";

// Define ProjectStatus type based on allowed values
type ProjectStatus = 'Start' | 'OnProgress' | 'Resolve' | 'Finish' | 'Cancel';

const Prisma = new PrismaClient();

export const getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const projects = await Prisma.project.findMany({
            where: { deletedAt: null }, // Only fetch active projects
            include: {
                projectTeams: { select: { teamId: true } },
                createdBy: { select: { username: true } }, // Include creator's name
            }
        });
        const projectsWithTeamId = projects.map(p => ({
            ...p,
            teamId: p.projectTeams[0]?.teamId || null,
        }));
        res.json(projectsWithTeamId);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving projects: ${error}` });
    }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
    const { name, description, startDate, endDate, teamId } = req.body;
    const loggedInUser = req.user;

    if (!teamId) {
        res.status(400).json({ message: "A teamId is required to create a project." });
        return;
    }

    try {
        const newProject = await Prisma.project.create({
            data: {
                name,
                description,
                startDate,
                endDate,
                version: 1,
                status: 'Start', // Default status
                createdById: loggedInUser?.userId,
                updatedById: loggedInUser?.userId, // Creator is also the first updater
                projectTeams: {
                    create: { teamId: Number(teamId) }
                }
            },
        });

        // Broadcast a general project update
        broadcast({ type: 'PROJECT_UPDATE' });

        res.status(201).json(newProject);
    } catch (error) {
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
                    increment: 1
                }
            }
        });

        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: `Error updating project version: ${error}` });
    }
}

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

    try {
        // First, check if the project exists and is not deleted
        const project = await Prisma.project.findFirst({
            where: { id: numericProjectId, deletedAt: null }
        });

        if (!project) {
            res.status(404).json({ message: "Project not found or has been archived." });
            return;
        }

        const projectTeam = await Prisma.projectTeam.findFirst({
            where: { projectId: numericProjectId },
            select: { teamId: true }
        });

        if (!projectTeam) {
            res.json([]);
            return;
        }

        const memberships = await Prisma.teamMembership.findMany({
            where: { 
                teamId: projectTeam.teamId,
                user: {
                    deletedAt: null // Only include memberships where user is not deleted
                }
            },
            include: { user: true }
        });
        
        const users = memberships.map(membership => membership.user);
        
        res.json(users);
    } catch (error) {
        console.error(`Error retrieving project users for projectId ${projectId}:`, error);
        res.status(500).json({ message: `Error retrieving project users: ${error}` });
    }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
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
            const taskIdsToDelete = tasksToDelete.map(task => task.id);

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
                await tx.taskAssignment.deleteMany({ where: { taskId: { in: taskIdsToDelete } } });

                // Soft delete all tasks
                await tx.task.updateMany({
                    where: { id: { in: taskIdsToDelete } },
                    data: { deletedAt: deletionDate, deletedById: deleterId },
                });
            }

            // Hard delete project-specific join/history tables
            await tx.projectTeam.deleteMany({ where: { projectId: numericProjectId } });
            await tx.projectStatusHistory.deleteMany({ where: { projectId: numericProjectId } });
            await tx.projectVersion.deleteMany({ where: { projectId: numericProjectId } });

            // Soft delete the project itself
            await tx.project.update({
                where: { id: numericProjectId },
                data: { deletedAt: deletionDate, deletedById: deleterId },
            });
        });

        broadcast({ type: 'PROJECT_UPDATE' });

        res.status(200).json({ message: "Project and all its related data have been successfully archived." });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: `Error deleting project` });
    }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { name, description, startDate, endDate, teamId } = req.body;
    const loggedInUser = req.user;

    try {
        const numericProjectId = Number(projectId);
        await Prisma.$transaction(async (tx) => {
            const updatedProject = await tx.project.update({
                where: { id: numericProjectId },
                data: { 
                    name, 
                    description, 
                    startDate, 
                    endDate,
                    updatedById: loggedInUser?.userId
                },
            });
            if (teamId) {
                await tx.projectTeam.updateMany({
                    where: { projectId: numericProjectId },
                    data: { teamId: Number(teamId) },
                });
            }

            // Broadcast an update for this specific project
            broadcast({ type: 'PROJECT_UPDATE', projectId: numericProjectId });

            res.status(200).json(updatedProject);
        });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: `Error updating project` });
    }
};

export const updateProjectStatus = async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { status } = req.body as { status: ProjectStatus };
    const loggedInUser = req.user;

    if (!loggedInUser) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    try {
        const numericProjectId = Number(projectId);
        const project = await Prisma.project.findUnique({ where: { id: numericProjectId }});

        if (!project || project.deletedAt) {
            res.status(404).json({ message: "Project not found." });
            return;
        }

        const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
            Start: ['OnProgress', 'Cancel'],
            OnProgress: ['Resolve', 'Cancel'],
            Resolve: ['OnProgress', 'Finish', 'Cancel'],
            Finish: [],
            Cancel: [],
        };

        if (!allowedTransitions[project.status].includes(status)) {
            res.status(400).json({ message: `Cannot transition from '${project.status}' to '${status}'.` });
            return;
        }

        // --- THIS IS THE FIX ---
        // Add a specific check before allowing the 'Finish' status.
        if (status === 'Finish') {
            const activeTasks = await Prisma.task.findMany({
                where: {
                    projectId: numericProjectId,
                    version: project.version, // Only check tasks for the current version
                    deletedAt: null,
                }
            });

            const allTasksCompleted = activeTasks.every(task => task.status === 'Completed');

            if (!allTasksCompleted) {
                // This is the error message you were seeing.
                res.status(400).json({ message: "All tasks for the current version must be completed before a project can be finished." });
                return;
            }
        }
        // --- End of Fix ---

        await Prisma.$transaction(async (tx) => {
            await tx.project.update({
                where: { id: numericProjectId },
                data: { 
                    status: status,
                    updatedById: loggedInUser.userId
                },
            });
            await tx.projectStatusHistory.create({
                data: {
                    projectId: numericProjectId,
                    status: status,
                    changedById: loggedInUser.userId,
                }
            });
        });

        broadcast({ type: 'PROJECT_UPDATE', projectId: numericProjectId });

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

    if (!startDate || !endDate) { /* ... */ }

    try {
        await Prisma.$transaction(async (tx) => {
            const currentProject = await tx.project.findUnique({
                where: { id: numericProjectId },
            });

            if (!currentProject || !currentProject.version || !currentProject.startDate) {
                res.status(404).json({ message: "Project or its version/dates not found." });
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
                    status: 'Start',
                    updatedById: loggedInUser?.userId,
                },
            });
            
            // 3. Archive old tasks
            await tx.task.updateMany({
                where: {
                    projectId: numericProjectId,
                    version: currentProject.version,
                },
                data: { status: 'Archived' },
            });

            broadcast({ type: 'PROJECT_UPDATE', projectId: numericProjectId });

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
    try {
        const versions = await Prisma.projectVersion.findMany({
            where: {
                projectId: Number(projectId)
            },
            orderBy: {
                version: 'desc'
            }
        });
        res.json(versions);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving project version history: ${error}` });
    }
};

export const getAllProjectVersions = async (req: Request, res: Response): Promise<void> => {
    try {
        const versions = await Prisma.projectVersion.findMany({
            // Order them to make the timeline consistent
            orderBy: [
                {
                    projectId: 'asc',
                },
                {
                    version: 'asc',
                },
            ]
        });
        res.json(versions);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving all project versions: ${error}` });
    }
};

export const getProjectActivities = async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    try {
        const activities = await Prisma.activity.findMany({
            where: { projectId: Number(projectId) },
            include: {
                user: { select: { username: true, profilePictureUrl: true } },
                task: { select: { title: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving project activities: ${error}` });
    }
};