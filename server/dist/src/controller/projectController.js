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
exports.updateProject = exports.deleteProject = exports.getProjectUsers = exports.incrementProjectVersion = exports.createProject = exports.getProjects = void 0;
const client_1 = require("@prisma/client");
const Prisma = new client_1.PrismaClient();
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield Prisma.project.findMany({
            include: {
                projectTeams: {
                    select: {
                        teamId: true
                    }
                }
            }
        });
        const projectsWithTeamId = projects.map(p => {
            var _a;
            return (Object.assign(Object.assign({}, p), { teamId: ((_a = p.projectTeams[0]) === null || _a === void 0 ? void 0 : _a.teamId) || null }));
        });
        res.json(projectsWithTeamId);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving projects: ${error}` });
    }
});
exports.getProjects = getProjects;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, startDate, endDate, teamId } = req.body;
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
        const projectTeam = yield Prisma.projectTeam.findFirst({
            where: { projectId: numericProjectId },
            select: { teamId: true }
        });
        if (!projectTeam) {
            res.json([]);
            return;
        }
        const memberships = yield Prisma.teamMembership.findMany({
            where: { teamId: projectTeam.teamId },
            include: {
                user: true
            }
        });
        const users = memberships.map(membership => membership.user);
        res.json(users);
    }
    catch (error) {
        console.error(`Error retrieving project users for projectId ${projectId}:`, error);
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
        yield Prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            const tasks = yield prisma.task.findMany({
                where: { projectId: numericProjectId },
                select: { id: true },
            });
            const taskIds = tasks.map(task => task.id);
            if (taskIds.length > 0) {
                yield prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
                yield prisma.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
                yield prisma.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
                yield prisma.task.deleteMany({ where: { projectId: numericProjectId } });
            }
            yield prisma.projectTeam.deleteMany({ where: { projectId: numericProjectId } });
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
// --- UPDATED AND CORRECTED updateProject function ---
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { name, description, startDate, endDate, teamId } = req.body;
    try {
        const numericProjectId = Number(projectId);
        yield Prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Update the project's details
            const updatedProject = yield tx.project.update({
                where: { id: numericProjectId },
                data: { name, description, startDate, endDate },
            });
            // 2. Update the team association in the ProjectTeam table
            if (teamId) {
                yield tx.projectTeam.updateMany({
                    where: { projectId: numericProjectId },
                    data: { teamId: Number(teamId) },
                });
            }
            res.status(200).json(updatedProject);
        }));
    }
    catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: `Error updating project: ${error}` });
    }
});
exports.updateProject = updateProject;
