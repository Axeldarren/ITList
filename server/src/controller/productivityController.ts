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
    const now = new Date();

    try {
        const loggedInUser = req.user;
        const isBusinessOwner = loggedInUser?.role === 'BUSINESS_OWNER';
        const isAdmin = loggedInUser?.role === 'ADMIN';

        // Ensure only Admin or Business Owner can access
        if (!isAdmin && !isBusinessOwner) {
            res.status(403).json({ message: "You do not have permission to perform this action." });
            return;
        }

        // Under UAT-54, Business Owners can view all project and task metrics
        // So we don't need to filter by owned projects anymore.
        // We still support projectId filtering if provided in the query.

        // Get ALL active users
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
            },
        });
        
        const stats = await Promise.all(users.map(async (user) => {
            // ... (date calculation remains the same)
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
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
            }

            // 1. Calculate Time Logs - filter by owned projects if BO
            const timeLogWhere: any = {
                userId: user.userId,
                task: {
                    deletedAt: null,
                    ...(projectIdNum ? { projectId: projectIdNum } : {})
                },
                startTime: { gte: startDate, lte: endDate }
            };
            
            const timeLogs = await prisma.timeLog.findMany({
                where: timeLogWhere
            });
            const totalTimeLogged = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
            
            // 2. Get all relevant assigned tasks 
            const taskWhere: any = {
                assignedUserId: user.userId,
                deletedAt: null,
                status: { not: 'Archived' },
                project: {
                    deletedAt: null,
                    status: { not: 'Cancel' },
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

        // Optional: Filter stats if projectId is provided so we only show involved devs
        const filteredStats = projectIdNum ? sortedStats.filter(s => s.totalTimeLogged > 0 || s.totalTasks > 0) : sortedStats;
        const finalTotal = filteredStats.length;

        // Return paginated response if pagination params provided
        if (page && limit) {
            const paginatedStats = filteredStats.slice((pageNum - 1) * limitNum, pageNum * limitNum);
            res.status(200).json({
                data: paginatedStats,
                meta: {
                    total: finalTotal,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(finalTotal / limitNum)
                }
            });
        } else {
            // Return sorted array for backward compatibility
            res.status(200).json(filteredStats);
        }

    } catch (error: any) {
        console.error(`Error fetching developer stats: ${error.message}`);
        res.status(500).json({ message: `Error fetching developer stats: ${error.message}` });
    }
};