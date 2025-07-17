import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

export const getProjects = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const projects = await Prisma.project.findMany({
            include: {
                projectTeams: {
                    select: {
                        teamId: true
                    }
                }
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

export const createProject = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { name, description, startDate, endDate, teamId } = req.body;

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
                projectTeams: {
                    create: {
                        teamId: Number(teamId),
                    }
                }
            },
        });
        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ message: `Error creating project: ${error}` });
    }
}

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
        const projectTeam = await Prisma.projectTeam.findFirst({
            where: { projectId: numericProjectId },
            select: { teamId: true }
        });

        if (!projectTeam) {
            res.json([]);
            return;
        }

        const memberships = await Prisma.teamMembership.findMany({
            where: { teamId: projectTeam.teamId },
            include: {
                user: true 
            }
        });
        
        const users = memberships.map(membership => membership.user);
        
        res.json(users);
    } catch (error) {
        console.error(`Error retrieving project users for projectId ${projectId}:`, error);
        res.status(500).json({ message: `Error retrieving project users: ${error}` });
    }
};


export const deleteProject = async (
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
        await Prisma.$transaction(async (prisma) => {
            // Find all tasks associated with the project to delete their dependencies
            const tasks = await prisma.task.findMany({
                where: { projectId: numericProjectId },
                select: { id: true },
            });
            const taskIds = tasks.map(task => task.id);

            // Delete all dependencies of the tasks
            if (taskIds.length > 0) {
                await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.task.deleteMany({ where: { projectId: numericProjectId } });
            }

            // Delete project-team associations
            await prisma.projectTeam.deleteMany({ where: { projectId: numericProjectId } });
            
            // --- THIS IS THE FIX ---
            // Delete all archived versions associated with the project
            await prisma.projectVersion.deleteMany({ 
                where: { projectId: numericProjectId } 
            });

            // Finally, delete the project itself
            await prisma.project.delete({ where: { id: numericProjectId } });
        });

        res.status(200).json({ message: "Project and all associated data deleted successfully." });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: `Error deleting project: ${error}` });
    }
};

// --- UPDATED AND CORRECTED updateProject function ---
export const updateProject = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { projectId } = req.params;
    const { name, description, startDate, endDate, teamId } = req.body;

    try {
        const numericProjectId = Number(projectId);

        await Prisma.$transaction(async (tx) => {
            // 1. Update the project's details
            const updatedProject = await tx.project.update({
                where: { id: numericProjectId },
                data: { name, description, startDate, endDate },
            });

            // 2. Update the team association in the ProjectTeam table
            if (teamId) {
                await tx.projectTeam.updateMany({
                    where: { projectId: numericProjectId },
                    data: { teamId: Number(teamId) },
                });
            }
            
            res.status(200).json(updatedProject);
        });

    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: `Error updating project: ${error}` });
    }
};

export const archiveAndIncrementVersion = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { projectId } = req.params;
    const { startDate, endDate } = req.body; // <-- Get new dates from the request body
    const numericProjectId = Number(projectId);

    // --- NEW: Validate that the new dates are provided ---
    if (!startDate || !endDate) {
        res.status(400).json({ message: "Start date and end date are required for the new version." });
        return;
    }

    try {
        await Prisma.$transaction(async (tx) => {
            const currentProject = await tx.project.findUnique({
                where: { id: numericProjectId },
            });

            if (!currentProject || !currentProject.version || !currentProject.startDate || !currentProject.endDate) {
                res.status(404).json({ message: "Project or its version/dates not found." });
                return;
            }
            
            // 1. Archive the current version
            await tx.projectVersion.create({
                data: {
                    projectId: currentProject.id,
                    version: currentProject.version,
                    name: currentProject.name,
                    description: currentProject.description,
                    startDate: currentProject.startDate,
                    endDate: new Date(),
                },
            });

            // 2. Increment the version and set the new dates
            const updatedProject = await tx.project.update({
                where: { id: numericProjectId },
                data: {
                    version: {
                        increment: 1,
                    },
                    startDate: new Date(startDate), // Use the new start date
                    endDate: new Date(endDate),     // Use the new end date
                },
            });
            
            // 3. Mark all tasks from the previous version as "Archived"
            await tx.task.updateMany({
                where: {
                    projectId: numericProjectId,
                    version: currentProject.version,
                },
                data: {
                    status: 'Archived',
                },
            });

            res.status(200).json(updatedProject);
        });
    } catch (error) {
        console.error("Error archiving project version:", error);
        res.status(500).json({ message: `Error archiving project: ${error}` });
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