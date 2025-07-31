import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";

const Prisma = new PrismaClient();

export const createAttachment = async (req: Request, res: Response) => {
    // The task ID will now be in the request body
    const { taskId, uploadedById } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (!taskId || !uploadedById) {
        return res.status(400).json({ message: 'Missing taskId or uploadedById in request body.' });
    }
    
    try {
        const newAttachment = await Prisma.attachment.create({
            data: {
                taskId: Number(taskId),
                uploadedById: Number(uploadedById),
                fileName: req.file.originalname,
                // Save the path to the file provided by multer
                fileURL: `/uploads/${req.file.filename}`, 
            },
        });

        broadcast({ type: 'ATTACHMENT_UPDATE', taskId: Number(taskId) });
        res.status(201).json(newAttachment);
    } catch (error: any) {
        console.error("Error creating attachment:", error);
        res.status(500).json({ message: `Error creating attachment: ${error.message}` });
    }
};

export const deleteAttachment = async (req: Request, res: Response) => {
    const { attachmentId } = req.params;
    const loggedInUser = req.user;

    try {
        await Prisma.attachment.update({
            where: { id: Number(attachmentId) },
            data: {
                deletedAt: new Date(),
                deletedById: loggedInUser?.userId
            }
        });

        broadcast({ type: 'ATTACHMENT_UPDATE', attachmentId: Number(attachmentId) });
        res.status(200).json({ message: "Attachment deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({ message: `Error deleting attachment: ${error.message}` });
    }
};