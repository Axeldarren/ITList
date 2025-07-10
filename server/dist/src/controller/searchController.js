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
exports.getSuggestions = exports.search = void 0;
const client_1 = require("@prisma/client");
const Prisma = new client_1.PrismaClient();
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = req.query;
    try {
        const tasks = yield Prisma.task.findMany({
            where: {
                OR: [
                    { title: { contains: query } },
                    { description: { contains: query } }
                ],
            },
            // --- FIX: Include the project relation to get the project name ---
            include: {
                project: {
                    select: {
                        name: true,
                    }
                }
            }
        });
        const projects = yield Prisma.project.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { description: { contains: query } }
                ],
            },
        });
        const users = yield Prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query } },
                ],
            },
        });
        res.json({ tasks, projects, users });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error performing search: ${error.message}` });
    }
});
exports.search = search;
const getSuggestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
        res.json([]);
        return;
    }
    try {
        const taskSuggestions = yield Prisma.task.findMany({
            where: { title: { contains: q } },
            take: 5,
            select: { title: true }
        });
        const projectSuggestions = yield Prisma.project.findMany({
            where: { name: { contains: q } },
            take: 3,
            select: { name: true }
        });
        // Create a structured response
        const suggestions = [
            ...projectSuggestions.map(p => ({ text: p.name, type: 'Project' })),
            ...taskSuggestions.map(t => ({ text: t.title, type: 'Task' })),
        ];
        res.json(suggestions.slice(0, 8));
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching suggestions" });
    }
});
exports.getSuggestions = getSuggestions;
