import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

export const getProjects = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const projects = await Prisma.project.findMany();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving projects: ${error}` });
    }
};

export const createProject = async (
    req: Request,
    res: Response
): Promise<void> => {
    // Add teamId to the destructured request body
    const { name, description, startDate, endDate, teamId } = req.body;

    // Validate that a teamId was provided
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
                // Create the link in the ProjectTeam table
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
        // Find the single team associated with the project
        const projectTeam = await Prisma.projectTeam.findFirst({
            where: { projectId: numericProjectId },
        });

        if (!projectTeam) {
            // If no team is assigned to the project, return an empty array
            res.json([]);
            return;
        }

        // Get the users from that single team
        const users = await Prisma.user.findMany({
            where: {
                teamId: projectTeam.teamId,
            },
        });
        
        res.json(users);
    } catch (error) {
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
        // Use a transaction to ensure all related data is deleted
        await Prisma.$transaction(async (prisma) => {
            // Find all tasks related to the project
            const tasks = await prisma.task.findMany({
                where: { projectId: numericProjectId },
                select: { id: true },
            });
            const taskIds = tasks.map(task => task.id);

            if (taskIds.length > 0) {
                // Delete all comments, attachments, and assignments for those tasks
                await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });

                // Delete all tasks in the project
                await prisma.task.deleteMany({ where: { projectId: numericProjectId } });
            }

            // Delete the project's team associations
            await prisma.projectTeam.deleteMany({ where: { projectId: numericProjectId } });

            // Finally, delete the project itself
            await prisma.project.delete({ where: { id: numericProjectId } });
        });

        res.status(200).json({ message: "Project and all associated data deleted successfully." });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: `Error deleting project: ${error}` });
    }
};