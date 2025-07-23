// server/src/controller/commentController.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createComment = async (req: Request, res: Response) => {
    const { text, taskId } = req.body;
    const loggedInUser = req.user;

    if (!text || !taskId || !loggedInUser) {
        return res.status(400).json({ message: "Missing required fields or user not logged in." });
    }

    try {
        const newComment = await prisma.comment.create({
            data: {
                text,
                taskId: Number(taskId),
                userId: loggedInUser.userId, // This is the "createdBy"
                updatedById: loggedInUser.userId, // The creator is the first updater
            },
            include: { user: true },
        });
        res.status(201).json(newComment);
    } catch (error: any) {
        res.status(500).json({ message: `Error creating comment: ${error.message}` });
    }
};

export const updateComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { text } = req.body;
    const loggedInUser = req.user;

    if (!text) {
        return res.status(400).json({ message: "Comment text cannot be empty." });
    }

    try {
        const updatedComment = await prisma.comment.update({
            where: { id: Number(commentId) },
            data: { 
                text,
                updatedById: loggedInUser?.userId, // Stamp the updater
            },
            include: { user: true },
        });
        res.status(200).json(updatedComment);
    } catch (error: any) {
        res.status(500).json({ message: `Error updating comment: ${error.message}` });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const loggedInUser = req.user;

    try {
        await prisma.comment.update({
            where: { id: Number(commentId) },
            data: {
                deletedAt: new Date(),
                deletedById: loggedInUser?.userId,
            },
        });
        res.status(200).json({ message: "Comment deleted successfully." });
    } catch (error: any) {
        res.status(500).json({ message: `Error deleting comment: ${error.message}` });
    }
};