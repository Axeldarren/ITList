import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany();
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
            where: { userId: Number(userId) },
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
    // Only handles text-based fields
    const { username, email, NIK } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { userId: Number(userId) },
            data: { 
                username, 
                email, 
                NIK: NIK ? Number(NIK) : undefined 
            },
        });
        res.status(200).json(updatedUser);
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

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading profile picture.' });
    }
};