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

        // Restructure the data to be more convenient for the frontend
        const projectsWithTeamId = projects.map(p => ({
            ...p,
            teamId: p.projectTeams[0]?.teamId || null, // Assuming one team per project
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

/**
 * Deletes a project and all its associated data, including tasks, comments, attachments,
 * task assignments, and project-team associations. The deletion is performed within a
 * database transaction to ensure data integrity.
 *
 * @param req - Express request object containing the project ID in the route parameters.
 * @param res - Express response object used to send the result of the deletion operation.
 * @returns A promise that resolves when the operation is complete. Sends a JSON response
 *          indicating success or failure.
 *
 * @remarks
 * - Returns a 400 status code if the project ID is invalid.
 * - Returns a 200 status code if the project and all related data are deleted successfully.
 * - Returns a 500 status code if an error occurs during the deletion process.
 */

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

export const updateProject = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { projectId } = req.params;
    const { name, description, startDate, endDate, teamId } = req.body;

    try {
        const updatedProject = await Prisma.project.update({
            where: { id: Number(projectId) },
            data: {
                name,
                description,
                startDate,
                endDate,
                projectTeams: {
                    updateMany: {
                        where: {},
                        data: {
                            teamId: Number(teamId)
                        }
                    }
                }
            },
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: `Error updating project: ${error}` });
    }
};