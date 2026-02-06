import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

const prisma = new PrismaClient();

export const getDeveloperStats = async (req: Request, res: Response) => {
    const { month, startMonth, endMonth, projectId, page, limit } = req.query as { 
        month?: string; 
        startMonth?: string; 
        endMonth?: string;
        projectId?: string;
        page?: string;
        limit?: string;
    };

    // Pagination defaults
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;

    try {
        // Get ALL active users first (we'll paginate after sorting by stats)
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null, // Only get active users
            },
        });
        
        const totalUsers = users.length;
        const now = new Date();
        
        const stats = await Promise.all(users.map(async (user) => {
            // Define the date range for the queries
            let startDate: Date;
            let endDate: Date;

            if (startMonth && endMonth) {
                startDate = startOfMonth(parseISO(`${startMonth}-01`));
                endDate = endOfMonth(parseISO(`${endMonth}-01`));
            } else if (month) {
                const selectedDate = parseISO(`${month}-01`);
                startDate = startOfMonth(selectedDate);
                endDate = endOfMonth(selectedDate);
            } else {
                // Default to current month if no date is provided
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
            }

            // 1. Calculate Time Logs within the date range (with optional project filter)
            const timeLogWhere: any = {
                userId: user.userId,
                task: {
                    deletedAt: null,
                    ...(projectIdNum && { projectId: projectIdNum })
                },
                startTime: { gte: startDate, lte: endDate }
            };
            
            const timeLogs = await prisma.timeLog.findMany({
                where: timeLogWhere
            });
            const totalTimeLogged = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
            
            // 2. Get all relevant assigned tasks for the user (with optional project filter)
            const taskWhere: any = {
                assignedUserId: user.userId,
                deletedAt: null,
                status: { not: 'Archived' },
                project: {
                    deletedAt: null,
                    status: { not: 'Cancel' }
                },
                ...(projectIdNum && { projectId: projectIdNum })
            };
            
            const allAssignedTasks = await prisma.task.findMany({
                where: taskWhere,
                select: {
                    status: true,
                    dueDate: true,
                    createdAt: true,
                    points: true,
                }
            });

            // 3. Filter tasks by the date range in the application code
            const tasksInRange = allAssignedTasks.filter(t => {
                const taskDate = new Date(t.createdAt);
                return taskDate >= startDate && taskDate <= endDate;
            });

            const completedTasks = tasksInRange.filter(t => t.status === 'Completed').length;
            
            const inProgressTasks = tasksInRange.filter(t => t.status === 'Work In Progress' || t.status === 'Under Review' || t.status === 'To Do').length;
            const totalTasks = inProgressTasks + completedTasks;

            const totalStoryPoints = tasksInRange.reduce((sum, task) => sum + (task.points || 0), 0);
            const completedStoryPoints = tasksInRange.filter(t => t.status === 'Completed').reduce((sum, task) => sum + (task.points || 0), 0);

            // Overdue tasks are active tasks (not completed) that are past their due date.
            const overdueTasks = allAssignedTasks.filter(t => {
                if (!t.dueDate || t.status === 'Completed') return false;
                const dueDate = new Date(t.dueDate);
                dueDate.setHours(23, 59, 59, 999); // Set to end of day for comparison
                return dueDate < now;
            }).length;

            return {
                userId: user.userId,
                username: user.username,
                totalTasks,
                completedTasks,
                overdueTasks,
                totalTimeLogged,
                totalStoryPoints,
                completedStoryPoints,
                role: user.role,
            };
        }));

        // Sort all stats by totalTimeLogged (most to least) before pagination
        const sortedStats = stats.sort((a, b) => b.totalTimeLogged - a.totalTimeLogged);

        // Return paginated response if pagination params provided
        if (page && limit) {
            const paginatedStats = sortedStats.slice((pageNum - 1) * limitNum, pageNum * limitNum);
            res.status(200).json({
                data: paginatedStats,
                meta: {
                    total: totalUsers,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalUsers / limitNum)
                }
            });
        } else {
            // Return sorted array for backward compatibility
            res.status(200).json(sortedStats);
        }

    } catch (error: any) {
        console.error(`Error fetching developer stats: ${error.message}`);
        res.status(500).json({ message: `Error fetching developer stats: ${error.message}` });
    }
};