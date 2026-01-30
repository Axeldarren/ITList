import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { broadcast } from '../websocket';
import validator from 'validator';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
        });
        const sanitized = users.map((u: any) => ({
            userId: u.userId,
            username: u.username,
            email: u.email,
            profilePictureUrl: u.profilePictureUrl,
            isAdmin: u.isAdmin,
            NIK: u.NIK,
            department: u.department || null,
        }));
        res.json(sanitized);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { 
                userId: userId,
                deletedAt: null 
             },
        });
        if (user) {
            const { password, ...rest } = user as any;
            const sanitized = {
                ...rest,
                department: (rest as any).department || null,
            };
            res.json(sanitized);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// --- Function to update user profile information ---
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const loggedInUser = req.user;
    
    const { username, email, NIK, isAdmin, department } = req.body;

    if (!loggedInUser) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    try {
        const dataToUpdate: any = {
            username,
            email,
            NIK: NIK ? Number(NIK) : undefined,
            ...( department ? { department } : {} ),
        };

        // --- THIS IS THE FIX ---
        // Securely handle the isAdmin flag
        if (loggedInUser.isAdmin) {
            // Only an admin can change the isAdmin status
            if (typeof isAdmin === 'boolean') {
                dataToUpdate.isAdmin = isAdmin;
            }
        } else if (isAdmin === true && !loggedInUser.isAdmin) {
            // A non-admin cannot make themselves an admin
            res.status(403).json({ message: 'You do not have permission to change admin status.' });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { userId: userId },
            data: dataToUpdate,
        });

        broadcast({ type: 'USER_UPDATE' }); // Broadcast user update

        // Ensure the password is not sent back to the client
        const { password, ...userWithoutPassword } = updatedUser as any;
        res.status(200).json({
            ...userWithoutPassword,
            department: (updatedUser as any).department || null,
        });

    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'Username or email already in use.' });
        } else {
            res.status(500).json({ message: 'Error updating user', error: error.message });
        }
    }
};

// --- NEW: Function to handle profile picture upload ---
export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
    }

    try {
        // Find the user to get the old profile picture URL
        const user = await prisma.user.findUnique({
            where: { userId: userId },
        });

        // The URL path where the new file is accessible
        const profilePictureUrl = `/uploads/${req.file.filename}`;

        // Update the user with the new profile picture URL
        const updatedUser = await prisma.user.update({
            where: { userId: userId },
            data: { profilePictureUrl },
        });

        // Delete the old profile picture file if it exists and is not null
        if (user?.profilePictureUrl) {
            const oldFilePath = path.join(
                __dirname,
                '..',
                '..',
                'public',
                user.profilePictureUrl
            );
            fs.unlink(oldFilePath, (err) => {
                // Ignore error if file does not exist
            });
        }

        broadcast({ type: 'USER_UPDATE' });

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading profile picture.' });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password, NIK, isAdmin, department } = req.body;

    // Input validation
    if (!username || !email || !password) {
        res.status(400).json({ 
            status: 'error',
            message: 'Username, email, and password are required.' 
        });
        return;
    }

    // Validate email format
    if (!validator.isEmail(email)) {
        res.status(400).json({ 
            status: 'error',
            message: 'Please provide a valid email address' 
        });
        return;
    }

    // Validate password strength
    if (password.length < 8) {
        res.status(400).json({ 
            status: 'error',
            message: 'Password must be at least 8 characters long' 
        });
        return;
    }

    // Validate username
    if (username.length < 3 || username.length > 50) {
        res.status(400).json({ 
            status: 'error',
            message: 'Username must be between 3 and 50 characters' 
        });
        return;
    }

    // Sanitize inputs
    const sanitizedEmail = validator.normalizeEmail(email, {
        all_lowercase: true,
        gmail_remove_dots: false
    });

    if (!sanitizedEmail) {
        res.status(400).json({ 
            status: 'error',
            message: 'Invalid email format' 
        });
        return;
    }

    const sanitizedUsername = validator.escape(username.trim());

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: sanitizedEmail },
                    { username: sanitizedUsername }
                ]
            }
        });

        if (existingUser) {
            res.status(409).json({ 
                status: 'error',
                message: 'User with this email or username already exists' 
            });
            return;
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                username: sanitizedUsername,
                email: sanitizedEmail,
                password: hashedPassword,
                NIK: NIK ? Number(NIK) : 0,
                isAdmin: isAdmin || false,
                ...( department ? { department } : {} ),
            } as any,
        });

        broadcast({ type: 'USER_UPDATE' });

        const { password: _pwd, ...userWithoutPassword } = newUser as any;
        res.status(201).json({
            status: 'success',
            data: { user: {
                ...userWithoutPassword,
                department: (newUser as any).department || null,
            } }
        });
    } catch (error: any) {
        console.error('Create user error:', error);
        if (error.code === 'P2002') {
            res.status(409).json({ 
                status: 'error',
                message: 'User with this email or username already exists' 
            });
        } else {
            res.status(500).json({ 
                status: 'error',
                message: 'Internal server error' 
            });
        }
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const loggedInUser = req.user;


    if (!loggedInUser) {
        res.status(401).json({ message: "Not authorized." });
        return;
    }

    // Prevent a user from deleting themselves
    if (loggedInUser.userId === userId) {
        res.status(400).json({ message: "You cannot delete your own account." });
        return;
    }

    try {
        await prisma.user.update({
            where: { userId: userId },
            data: {
                deletedAt: new Date(),
                deletedById: loggedInUser.userId,
            },
        });
        
        broadcast({ type: 'USER_UPDATE' });
        
        res.status(200).json({ message: `User with ID ${userId} has been successfully deleted.` });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: `Error deleting user: ${error.message}` });
    }
};

export const getUserWeeklyStats = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { weekOffset = 0 } = req.query;
    
    try {
        const offset = Number(weekOffset);
        
        // Calculate the start and end of the target week
        const now = new Date();
        const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay())); // Start of current week (Sunday)
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const targetWeekStart = new Date(currentWeekStart);
        targetWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
        
        const targetWeekEnd = new Date(targetWeekStart);
        targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
        targetWeekEnd.setHours(23, 59, 59, 999);
        
        // Get time logs for the week (excluding logs from deleted tasks)
        const timeLogs = await prisma.timeLog.findMany({
            where: {
                userId: userId,
                task: {
                    deletedAt: null // Exclude logs from deleted tasks
                },
                endTime: {
                    gte: targetWeekStart,
                    lte: targetWeekEnd
                }
            },
            include: {
                task: {
                    select: {
                        title: true,
                        points: true,
                        projectId: true,
                        project: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        
        // Get tasks completed in the target week (excluding deleted tasks)
        const completedTasks = await prisma.task.findMany({
            where: {
                assignedUserId: userId,
                status: 'Completed',
                deletedAt: null, // Exclude deleted tasks
                updatedAt: {
                    gte: targetWeekStart,
                    lte: targetWeekEnd
                }
            },
            select: {
                id: true,
                title: true,
                points: true,
                updatedAt: true,
                project: {
                    select: {
                        name: true
                    }
                }
            }
        });
        
        // Calculate total hours from time logs
        const totalSeconds = timeLogs.reduce((acc, log) => {
            if (log.endTime && log.startTime) {
                const duration = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
                return acc + Math.floor(duration / 1000);
            }
            return acc;
        }, 0);
        
        const totalHours = Math.round((totalSeconds / 3600) * 100) / 100; // Round to 2 decimal places
        
        // Calculate total story points from completed tasks
        const totalStoryPoints = completedTasks.reduce((acc, task) => {
            return acc + (task.points || 0);
        }, 0);
        
        res.json({
            totalHours,
            totalStoryPoints,
            timeLogs,
            completedTasks
        });
    } catch (error: any) {
        console.error("Error fetching user weekly stats:", error);
        res.status(500).json({ message: `Error fetching weekly stats: ${error.message}` });
    }
};

export const getDeveloperAssignments = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search = '', sort = 'username_asc', filter = 'all' } = req.query;
    
    try {
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const searchQuery = String(search).trim();
        const sortOption = String(sort);
        const filterOption = String(filter);

        // Build where clause for users
        const whereClause: any = {
            deletedAt: null,
        };

        if (searchQuery) {
            whereClause.OR = [
                { username: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } }
            ];
        }

        // Fetch ALL users matching search criteria to allow filtering/sorting by stats
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                userId: true,
                username: true,
                email: true,
                profilePictureUrl: true,
                isAdmin: true,
            }
        });

        // Calculate stats for ALL fetched users
        let developersWithStats = await Promise.all(users.map(async (user) => {
            const userId = user.userId;

            // 1. Get total task counts by status
            const statusCounts = await prisma.task.groupBy({
                by: ['status'],
                where: {
                    assignedUserId: userId,
                    deletedAt: null,
                    project: {
                        deletedAt: null
                    }
                },
                _count: {
                    id: true
                }
            });

            // 2. Get overdue tasks count
            const overdueCount = await prisma.task.count({
                where: {
                    assignedUserId: userId,
                    deletedAt: null,
                    status: {
                        notIn: ['Completed', 'Under Review', 'Archived']
                    },
                    dueDate: {
                        lt: new Date()
                    },
                    project: {
                        deletedAt: null
                    }
                }
            });

            // 3. Get top 3 active tasks sorted by due date
            const activeTasks = await prisma.task.findMany({
                where: {
                    assignedUserId: userId,
                    deletedAt: null,
                    status: {
                        notIn: ['Completed', 'Archived']
                    },
                    project: {
                        deletedAt: null
                    }
                },
                orderBy: [
                    { dueDate: 'asc' },
                ],
                take: 3,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    projectId: true,
                    project: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            // Process counts
            let totalTasks = 0;
            let todoTasks = 0;
            let inProgressTasks = 0;
            let underReviewTasks = 0;

            statusCounts.forEach(stat => {
                const count = stat._count.id;
                const status = stat.status || 'Unknown';
                
                if (status === 'To Do') todoTasks = count;
                if (status === 'Work In Progress') inProgressTasks = count;
                if (status === 'Under Review') underReviewTasks = count;
                
                // Total active workload
                if (status !== 'Completed' && status !== 'Archived') {
                    totalTasks += count;
                }
            });

            return {
                ...user,
                totalTasks,
                overdueTasks: overdueCount,
                inProgressTasks,
                todoTasks,
                underReviewTasks,
                tasks: activeTasks
            };
        }));

        // --- FILTERING ---
        if (filterOption === 'overdue') {
            developersWithStats = developersWithStats.filter(dev => dev.overdueTasks > 0);
        }

        // --- SORTING ---
        developersWithStats.sort((a, b) => {
            switch (sortOption) {
                case 'username_asc':
                    return a.username.localeCompare(b.username);
                case 'username_desc':
                    return b.username.localeCompare(a.username);
                case 'workload_high':
                    return b.totalTasks - a.totalTasks;
                case 'workload_low':
                    return a.totalTasks - b.totalTasks;
                default:
                    return a.username.localeCompare(b.username);
            }
        });

        // --- PAGINATION ---
        const totalUsers = developersWithStats.length;
        const totalPages = Math.ceil(totalUsers / limitNumber);
        const startIndex = (pageNumber - 1) * limitNumber;
        const paginatedDevelopers = developersWithStats.slice(startIndex, startIndex + limitNumber);

        res.json({
            data: paginatedDevelopers,
            meta: {
                totalUsers,
                page: pageNumber,
                limit: limitNumber,
                totalPages
            }
        });

    } catch (error) {
        console.error("Error fetching developer assignments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};