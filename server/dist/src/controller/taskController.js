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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.getUserTasks = exports.updateTaskStatus = exports.createTask = exports.getTasks = void 0;
const client_1 = require("@prisma/client");
const Prisma = new client_1.PrismaClient();
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.query;
    try {
        const tasks = yield Prisma.task.findMany({
            where: {
                projectId: Number(projectId),
            },
            include: {
                author: true,
                assignee: true,
                comments: true,
                attachments: true
            }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error}` });
    }
});
exports.getTasks = getTasks;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, status, priority, tags, startDate, dueDate, points, projectId, authorUserId, assignedUserId, } = req.body;
    if (!projectId) {
        res.status(400).json({ message: "A projectId is required." });
        return;
    }
    try {
        const project = yield Prisma.project.findUnique({
            where: {
                id: Number(projectId),
            },
        });
        if (!project) {
            res.status(404).json({ message: `Project with ID ${projectId} not found.` });
            return;
        }
        const projectVersion = project.version;
        const newTask = yield Prisma.task.create({
            data: {
                title,
                description,
                status,
                priority,
                tags,
                startDate,
                dueDate,
                points,
                projectId: Number(projectId),
                authorUserId,
                assignedUserId,
                version: projectVersion
            },
        });
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating task: ${error}` });
    }
});
exports.createTask = createTask;
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { status } = req.body;
    try {
        const updatedTask = yield Prisma.task.update({
            where: {
                id: Number(taskId),
            },
            data: {
                status: status,
            }
        });
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task status: ${error}` });
    }
});
exports.updateTaskStatus = updateTaskStatus;
const getUserTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield Prisma.task.findMany({
            where: {
                OR: [
                    { authorUserId: Number(userId) },
                    { assignedUserId: Number(userId) },
                ],
            },
            include: {
                author: true,
                assignee: true,
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving user's tasks: ${error.message}` });
    }
});
exports.getUserTasks = getUserTasks;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        yield Prisma.$transaction([
            Prisma.comment.deleteMany({ where: { taskId: Number(taskId) } }),
            Prisma.attachment.deleteMany({ where: { taskId: Number(taskId) } }),
            Prisma.taskAssignment.deleteMany({ where: { taskId: Number(taskId) } }),
            Prisma.task.delete({ where: { id: Number(taskId) } }),
        ]);
        res.status(200).json({ message: `Task with ID ${taskId} deleted successfully.` });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting task: ${error}` });
    }
});
exports.deleteTask = deleteTask;
