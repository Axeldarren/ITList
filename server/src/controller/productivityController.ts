import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

const prisma = new PrismaClient();

export const getDeveloperStats = async (req: Request, res: Response) => {
    const { month } = req.query as { month?: string };

    let dateFilter: any = {};
    if (month) {
        const selectedDate = parseISO(`${month}-01`);
        const startDate = startOfMonth(selectedDate);
        const endDate = endOfMonth(selectedDate);
        dateFilter = {
            createdAt: { gte: startDate, lte: endDate }
        };
    }

    try {
        const users = await prisma.user.findMany({
        });

        const now = new Date();
        
        const stats = await Promise.all(users.map(async (user) => {
            // --- THIS IS THE FIX ---

            // 1. Calculate Time Logs separately. This is a pure sum of work for the month.
            const timeLogs = await prisma.timeLog.findMany({
                where: {
                    userId: user.userId,
                    ...dateFilter // Only filter by date
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
                }
            });

            // 3. Apply the new, smarter logic for task counts IN THE CODE.
            const tasksInMonth = month 
                ? allAssignedTasks.filter(t => new Date(t.createdAt) >= new Date(dateFilter.createdAt.gte) && new Date(t.createdAt) <= new Date(dateFilter.createdAt.lte))
                : allAssignedTasks;

            const completedTasks = tasksInMonth.filter(t => t.status === 'Completed').length;
            
            // "Total Tasks" = In Progress tasks + Completed tasks for the month
            const inProgressTasks = tasksInMonth.filter(t => t.status === 'Work In Progress' || t.status === 'Under Review' || t.status === 'To Do').length;
            const totalTasks = inProgressTasks + completedTasks;

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
            };
        }));

        res.status(200).json(stats);

    } catch (error: any) {
        res.status(500).json({ message: `Error fetching developer stats: ${error.message}` });
    }
};