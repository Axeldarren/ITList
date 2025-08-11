import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

const prisma = new PrismaClient();

export const getDeveloperStats = async (req: Request, res: Response) => {
    const { month, startMonth, endMonth } = req.query as { month?: string; startMonth?: string; endMonth?: string };

    let dateFilter: any = {};
    
    if (startMonth && endMonth) {
        // Date range filtering
        const startDate = startOfMonth(parseISO(`${startMonth}-01`));
        const endDate = endOfMonth(parseISO(`${endMonth}-01`));
        dateFilter = {
            createdAt: { gte: startDate, lte: endDate }
        };
    } else if (month) {
        // Single month filtering (backward compatibility)
        const selectedDate = parseISO(`${month}-01`);
        const startDate = startOfMonth(selectedDate);
        const endDate = endOfMonth(selectedDate);
        dateFilter = {
            createdAt: { gte: startDate, lte: endDate }
        };
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null, // Only get active users
            }
        });

        const now = new Date();
        
        const stats = await Promise.all(users.map(async (user) => {
            // --- THIS IS THE FIX ---

            // 1. Calculate Time Logs separately. This is a pure sum of work for the date range.
            let timeLogDateFilter: any = {};
            if (startMonth && endMonth) {
                const startDate = startOfMonth(parseISO(`${startMonth}-01`));
                const endDate = endOfMonth(parseISO(`${endMonth}-01`));
                timeLogDateFilter = {
                    startTime: { gte: startDate, lte: endDate }
                };
            } else if (month) {
                const selectedDate = parseISO(`${month}-01`);
                const startDate = startOfMonth(selectedDate);
                const endDate = endOfMonth(selectedDate);
                timeLogDateFilter = {
                    startTime: { gte: startDate, lte: endDate }
                };
            }

            const timeLogs = await prisma.timeLog.findMany({
                where: {
                    userId: user.userId,
                    task: {
                        deletedAt: null // Only include time logs for non-deleted tasks
                    },
                    ...timeLogDateFilter
                }
            });
            const totalTimeLogged = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
            
            // 2. Get all potentially relevant tasks for this user.
            const allAssignedTasks = await prisma.task.findMany({
                where: {
                    assignedUserId: user.userId,
                    deletedAt: null,
                    status: { not: 'Archived' },
                    project: {
                        deletedAt: null,
                        status: { not: 'Cancel' }
                    }
                },
                select: {
                    status: true,
                    dueDate: true,
                    createdAt: true, // Needed for monthly filter
                    points: true, // Include story points
                }
            });

            // 3. Apply the new, smarter logic for task counts IN THE CODE.
            let tasksInRange = allAssignedTasks;
            
            if (startMonth && endMonth) {
                const startDate = startOfMonth(parseISO(`${startMonth}-01`));
                const endDate = endOfMonth(parseISO(`${endMonth}-01`));
                tasksInRange = allAssignedTasks.filter(t => {
                    const taskDate = new Date(t.createdAt);
                    return taskDate >= startDate && taskDate <= endDate;
                });
            } else if (month) {
                const selectedDate = parseISO(`${month}-01`);
                const startDate = startOfMonth(selectedDate);
                const endDate = endOfMonth(selectedDate);
                tasksInRange = allAssignedTasks.filter(t => {
                    const taskDate = new Date(t.createdAt);
                    return taskDate >= startDate && taskDate <= endDate;
                });
            }

            const completedTasks = tasksInRange.filter(t => t.status === 'Completed').length;
            
            // "Total Tasks" = In Progress tasks + Completed tasks for the range
            const inProgressTasks = tasksInRange.filter(t => t.status === 'Work In Progress' || t.status === 'Under Review' || t.status === 'To Do').length;
            const totalTasks = inProgressTasks + completedTasks;

            // Calculate total story points
            const totalStoryPoints = tasksInRange.reduce((sum, task) => sum + (task.points || 0), 0);
            const completedStoryPoints = tasksInRange.filter(t => t.status === 'Completed').reduce((sum, task) => sum + (task.points || 0), 0);

            // Overdue tasks are active tasks that are past their due date.
            const overdueTasks = allAssignedTasks.filter(t => {
                if (!t.dueDate || t.status === 'Completed') return false;
                const dueDate = new Date(t.dueDate);
                dueDate.setHours(23, 59, 59, 999);
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
                isAdmin: user.isAdmin,
            };
        }));

        res.status(200).json(stats);

    } catch (error: any) {
        res.status(500).json({ message: `Error fetching developer stats: ${error.message}` });
    }
};