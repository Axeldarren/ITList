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
exports.deleteTeam = exports.updateTeam = exports.createTeam = exports.getTeams = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// --- Get Teams (No Changes) ---
const getTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teams = yield prisma.team.findMany({
            include: {
                // Correct relation name is 'user' (singular) as per your schema
                user: true,
            },
        });
        // Manually fetch usernames for PO and PM to avoid relation errors
        const userIds = [
            ...new Set(teams.flatMap(team => [team.productOwnerUserId, team.projectManagerUserId]))
        ].filter(id => id != null);
        const users = yield prisma.user.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, username: true }
        });
        const userMap = new Map(users.map(u => [u.userId, u.username]));
        const teamsWithDetails = teams.map(team => (Object.assign(Object.assign({}, team), { productOwnerUsername: team.productOwnerUserId ? userMap.get(team.productOwnerUserId) : null, projectManagerUsername: team.projectManagerUserId ? userMap.get(team.projectManagerUserId) : null, memberCount: team.user.length, 
            // Rename 'user' to 'users' for frontend consistency
            users: team.user })));
        res.json(teamsWithDetails);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving teams: ${error.message}` });
    }
});
exports.getTeams = getTeams;
// --- UPDATED: Create a Team and Assign Users ---
const createTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds } = req.body;
    try {
        const newTeam = yield prisma.team.create({
            data: {
                teamName,
                productOwnerUserId: Number(productOwnerUserId),
                projectManagerUserId: Number(projectManagerUserId),
            },
        });
        // If member IDs are provided, update those users to be part of the new team
        if (memberIds && memberIds.length > 0) {
            yield prisma.user.updateMany({
                where: { userId: { in: memberIds.map((id) => Number(id)) } },
                data: { teamId: newTeam.id },
            });
        }
        res.status(201).json(newTeam);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating team: ${error}` });
    }
});
exports.createTeam = createTeam;
// --- UPDATED: Update a Team and its Members ---
const updateTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId } = req.params;
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds } = req.body;
    try {
        const teamIdNum = Number(teamId);
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Update the team's basic info
            const updatedTeam = yield tx.team.update({
                where: { id: teamIdNum },
                data: {
                    teamName,
                    productOwnerUserId: Number(productOwnerUserId),
                    projectManagerUserId: Number(projectManagerUserId),
                },
            });
            // 2. Get the list of users currently in the team
            const currentMembers = yield tx.user.findMany({
                where: { teamId: teamIdNum },
                select: { userId: true },
            });
            const currentMemberIds = currentMembers.map(u => u.userId);
            // 3. Unassign users who are no longer in the team
            const usersToRemove = currentMemberIds.filter(id => !memberIds.includes(id));
            if (usersToRemove.length > 0) {
                yield tx.user.updateMany({
                    where: { userId: { in: usersToRemove } },
                    data: { teamId: null },
                });
            }
            // 4. Assign new users to the team
            if (memberIds && memberIds.length > 0) {
                yield tx.user.updateMany({
                    where: { userId: { in: memberIds.map((id) => Number(id)) } },
                    data: { teamId: teamIdNum },
                });
            }
            res.status(200).json(updatedTeam);
        }));
    }
    catch (error) {
        res.status(500).json({ message: `Error updating team: ${error}` });
    }
});
exports.updateTeam = updateTeam;
// --- Delete Team (No Changes to logic, but it's important for context) ---
const deleteTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId } = req.params;
    try {
        yield prisma.projectTeam.deleteMany({ where: { teamId: Number(teamId) } });
        yield prisma.user.updateMany({ where: { teamId: Number(teamId) }, data: { teamId: null } });
        yield prisma.team.delete({ where: { id: Number(teamId) } });
        res.status(200).json({ message: `Team ${teamId} deleted successfully.` });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting team: ${error}` });
    }
});
exports.deleteTeam = deleteTeam;
