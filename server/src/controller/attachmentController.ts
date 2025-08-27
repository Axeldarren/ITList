import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";

const Prisma = new PrismaClient();

/**
 * Handles the creation of a new attachment for a task.
 *
 * Expects a file upload (handled by multer) and the following fields in the request body:
 * - `taskId`: The ID of the task to which the attachment belongs.
 * - `uploadedById`: The ID of the user uploading the attachment.
 *
 * Saves the attachment metadata to the database, including the file name and file URL.
 * Broadcasts an 'ATTACHMENT_UPDATE' event upon successful creation.
 *
 * @param req - Express request object, containing the file and body data.
 * @param res - Express response object, used to send the response.
 * @returns A JSON response with the created attachment or an error message.
 */

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

/**
 * Soft deletes an attachment by setting its `deletedAt` timestamp and `deletedById` fields.
 * 
 * This controller expects the `attachmentId` parameter in the request URL and the authenticated user
 * information in `req.user`. It updates the specified attachment in the database to mark it as deleted,
 * then broadcasts an `ATTACHMENT_UPDATE` event. Responds with a success message on completion or an error
 * message if the operation fails.
 * 
 * @param req - Express request object containing `attachmentId` in params and user info in `req.user`.
 * @param res - Express response object used to send the HTTP response.
 * 
 * @returns A JSON response indicating the result of the delete operation.
 */

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