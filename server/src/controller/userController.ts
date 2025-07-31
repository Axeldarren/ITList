import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { broadcast } from '../websocket';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null }
        });
        res.json(users);
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
                userId: Number(userId),
                deletedAt: null 
             },
        });
        if (user) {
            res.json(user);
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
    
    const { username, email, NIK, isAdmin } = req.body;

    if (!loggedInUser) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    try {
        const dataToUpdate: any = {
            username,
            email,
            NIK: NIK ? Number(NIK) : undefined,
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
            where: { userId: Number(userId) },
            data: dataToUpdate,
        });

        broadcast({ type: 'USER_UPDATE' }); // Broadcast user update

        // Ensure the password is not sent back to the client
        const { password, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);

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
            where: { userId: Number(userId) },
        });

        // The URL path where the new file is accessible
        const profilePictureUrl = `/uploads/${req.file.filename}`;

        // Update the user with the new profile picture URL
        const updatedUser = await prisma.user.update({
            where: { userId: Number(userId) },
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
    const { username, email, password, NIK, isAdmin } = req.body;

    if (!username || !email || !password) {
        res.status(400).json({ message: 'Username, email, and password are required.' });
        return;
    }

    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                NIK: NIK ? Number(NIK) : 0,
                isAdmin: isAdmin || false,
            },
        });
        
        // Remove password from the returned object
        const { password: _, ...userWithoutPassword } = newUser;

        broadcast({ type: 'USER_UPDATE' });

        res.status(201).json(userWithoutPassword);
    } catch (error: any) {
        if (error.code === 'P2002') { // Handle unique constraint errors (e.g., email already exists)
            res.status(409).json({ message: 'A user with this email or username already exists.' });
        } else {
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const loggedInUser = req.user;
    const numericUserId = Number(userId);

    if (!loggedInUser) {
        res.status(401).json({ message: "Not authorized." });
        return;
    }

    // Prevent a user from deleting themselves
    if (loggedInUser.userId === numericUserId) {
        res.status(400).json({ message: "You cannot delete your own account." });
        return;
    }

    try {
        await prisma.user.update({
            where: { userId: numericUserId },
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