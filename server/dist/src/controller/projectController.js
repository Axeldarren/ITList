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
exports.deleteProject = exports.getProjectUsers = exports.incrementProjectVersion = exports.createProject = exports.getProjects = void 0;
const client_1 = require("@prisma/client");
const Prisma = new client_1.PrismaClient();
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield Prisma.project.findMany();
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving projects: ${error}` });
    }
});
exports.getProjects = getProjects;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Add teamId to the destructured request body
    const { name, description, startDate, endDate, teamId } = req.body;
    // Validate that a teamId was provided
    if (!teamId) {
        res.status(400).json({ message: "A teamId is required to create a project." });
        return;
    }
    try {
        const newProject = yield Prisma.project.create({
            data: {
                name,
                description,
                startDate,
                endDate,
                version: 1,
                // Create the link in the ProjectTeam table
                projectTeams: {
                    create: {
                        teamId: Number(teamId),
                    }
                }
            },
        });
        res.status(201).json(newProject);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating project: ${error}` });
    }
});
exports.createProject = createProject;
const incrementProjectVersion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    try {
        const updatedProject = yield Prisma.project.update({
            where: {
                id: Number(projectId),
            },
            data: {
                version: {
                    increment: 1
                }
            }
        });
        res.status(200).json(updatedProject);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating project version: ${error}` });
    }
});
exports.incrementProjectVersion = incrementProjectVersion;
const getProjectUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const numericProjectId = Number(projectId);
    if (isNaN(numericProjectId)) {
        res.status(400).json({ message: "Invalid project ID." });
        return;
    }
    try {
        // Find the single team associated with the project
        const projectTeam = yield Prisma.projectTeam.findFirst({
            where: { projectId: numericProjectId },
        });
        if (!projectTeam) {
            // If no team is assigned to the project, return an empty array
            res.json([]);
            return;
        }
        // Get the users from that single team
        const users = yield Prisma.user.findMany({
            where: {
                teamId: projectTeam.teamId,
            },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving project users: ${error}` });
    }
});
exports.getProjectUsers = getProjectUsers;
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const numericProjectId = Number(projectId);
    if (isNaN(numericProjectId)) {
        res.status(400).json({ message: "Invalid project ID." });
        return;
    }
    try {
        // Use a transaction to ensure all related data is deleted
        yield Prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            // Find all tasks related to the project
            const tasks = yield prisma.task.findMany({
                where: { projectId: numericProjectId },
                select: { id: true },
            });
            const taskIds = tasks.map(task => task.id);
            if (taskIds.length > 0) {
                // Delete all comments, attachments, and assignments for those tasks
                yield prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
                yield prisma.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
                yield prisma.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
                // Delete all tasks in the project
                yield prisma.task.deleteMany({ where: { projectId: numericProjectId } });
            }
            // Delete the project's team associations
            yield prisma.projectTeam.deleteMany({ where: { projectId: numericProjectId } });
            // Finally, delete the project itself
            yield prisma.project.delete({ where: { id: numericProjectId } });
        }));
        res.status(200).json({ message: "Project and all associated data deleted successfully." });
    }
    catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: `Error deleting project: ${error}` });
    }
});
exports.deleteProject = deleteProject;
