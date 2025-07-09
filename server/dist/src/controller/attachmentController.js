"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttachment = exports.createAttachment = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Prisma = new client_1.PrismaClient();
const createAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The task ID will now be in the request body
    const { taskId, uploadedById } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    if (!taskId || !uploadedById) {
        return res.status(400).json({ message: 'Missing taskId or uploadedById in request body.' });
    }
    try {
        const newAttachment = yield Prisma.attachment.create({
            data: {
                taskId: Number(taskId),
                uploadedById: Number(uploadedById),
                fileName: req.file.originalname,
                // Save the path to the file provided by multer
                fileURL: `/uploads/${req.file.filename}`,
            },
        });
        res.status(201).json(newAttachment);
    }
    catch (error) {
        console.error("Error creating attachment:", error);
        res.status(500).json({ message: `Error creating attachment: ${error.message}` });
    }
});
exports.createAttachment = createAttachment;
const deleteAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { attachmentId } = req.params;
    try {
        // First, find the attachment to get the file path
        const attachment = yield Prisma.attachment.findUnique({
            where: { id: Number(attachmentId) },
        });
        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found." });
        }
        // Delete the attachment record from the database
        yield Prisma.attachment.delete({
            where: { id: Number(attachmentId) },
        });
        // Construct the full path to the file on the server
        const filePath = path_1.default.join(__dirname, '../../public', attachment.fileURL);
        // Delete the file from the filesystem
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        res.status(200).json({ message: "Attachment deleted successfully." });
    }
    catch (error) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({ message: `Error deleting attachment: ${error.message}` });
    }
});
exports.deleteAttachment = deleteAttachment;
