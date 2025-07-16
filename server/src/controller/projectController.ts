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
            const tasks = await prisma.task.findMany({
                where: { projectId: numericProjectId },
                select: { id: true },
            });
            const taskIds = tasks.map(task => task.id);

            if (taskIds.length > 0) {
                await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.task.deleteMany({ where: { projectId: numericProjectId } });
            }

            await prisma.projectTeam.deleteMany({ where: { projectId: numericProjectId } });
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
