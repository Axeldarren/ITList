import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from 'path';

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
        res.status(201).json(newAttachment);
    } catch (error: any) {
        console.error("Error creating attachment:", error);
        res.status(500).json({ message: `Error creating attachment: ${error.message}` });
    }
};

export const deleteAttachment = async (req: Request, res: Response) => {
    const { attachmentId } = req.params;

    try {
        // First, find the attachment to get the file path
        const attachment = await Prisma.attachment.findUnique({
            where: { id: Number(attachmentId) },
        });

        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found." });
        }

        // Delete the attachment record from the database
        await Prisma.attachment.delete({
            where: { id: Number(attachmentId) },
        });

        // Construct the full path to the file on the server
        const filePath = path.join(__dirname, '../../public', attachment.fileURL);

        // Delete the file from the filesystem
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({ message: "Attachment deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({ message: `Error deleting attachment: ${error.message}` });
    }
};