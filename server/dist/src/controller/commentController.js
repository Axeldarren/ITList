"use strict";
// server/src/controller/commentController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.createComment = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, taskId, userId } = req.body;
    if (!text || !taskId || !userId) {
        return res.status(400).json({ message: "Missing required fields." });
    }
    try {
        const newComment = yield prisma.comment.create({
            data: {
                text,
                taskId: Number(taskId),
                userId: Number(userId),
            },
            include: { user: true }, // Include user details on creation
        });
        res.status(201).json(newComment);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating comment: ${error.message}` });
    }
});
exports.createComment = createComment;
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: "Comment text cannot be empty." });
    }
    try {
        const updatedComment = yield prisma.comment.update({
            where: { id: Number(commentId) },
            data: { text },
            include: { user: true },
        });
        res.status(200).json(updatedComment);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating comment: ${error.message}` });
    }
});
exports.updateComment = updateComment;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    try {
        yield prisma.comment.delete({
            where: { id: Number(commentId) },
        });
        res.status(200).json({ message: "Comment deleted successfully." });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting comment: ${error.message}` });
    }
});
exports.deleteComment = deleteComment;
