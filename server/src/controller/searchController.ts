import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

export const search = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { query } = req.query;
    try {
        const tasks = await Prisma.task.findMany({
            where: {
                OR: [
                    { title: {contains: query as string }},
                    { description: {contains: query as string } }
                ],
            },
            // --- FIX: Include the project relation to get the project name ---
            include: {
                project: {
                    select: {
                        name: true,
                    }
                }
            }
        });

        const projects = await Prisma.project.findMany({
            where: {
                OR: [
                    { name: { contains: query as string } },
                    { description: { contains: query as string } }
                ],
            },
        });

        const users = await Prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query as string } },
                ],
            },
        });
        res.json({ tasks, projects, users });
    } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error performing search: ${error.message}` });
  }
};

export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
        res.json([]);
        return;
    }

    try {
        const taskSuggestions = await Prisma.task.findMany({
            where: { title: { contains: q } },
            take: 5,
            select: { title: true }
        });

        const projectSuggestions = await Prisma.project.findMany({
            where: { name: { contains: q } },
            take: 3,
            select: { name: true }
        });

        // Create a structured response
        const suggestions = [
            ...projectSuggestions.map(p => ({ text: p.name, type: 'Project' })),
            ...taskSuggestions.map(t => ({ text: t.title, type: 'Task' })),
        ];

        res.json(suggestions.slice(0, 8));

    } catch (error) {
        res.status(500).json({ message: "Error fetching suggestions" });
    }
};