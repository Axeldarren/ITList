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
// Get teams and their members through the new join table
const getTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teams = yield prisma.team.findMany({
            include: {
                members: { include: { user: true } },
            }
        });
        // Manually fetch usernames for PO and PM since relations are removed
        const userIds = [
            ...new Set(teams.map(team => team.productOwnerUserId)),
            ...new Set(teams.map(team => team.projectManagerUserId))
        ].filter(id => id != null);
        const users = yield prisma.user.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, username: true }
        });
        const userMap = new Map(users.map(u => [u.userId, u.username]));
        const teamsWithDetails = teams.map(team => (Object.assign(Object.assign({}, team), { users: team.members.map(m => m.user), productOwnerUsername: team.productOwnerUserId ? userMap.get(team.productOwnerUserId) : null, projectManagerUsername: team.projectManagerUserId ? userMap.get(team.projectManagerUserId) : null, memberCount: team.members.length })));
        res.json(teamsWithDetails);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving teams: ${error.message}` });
    }
});
exports.getTeams = getTeams;
// Create a team and create entries in the join table
const createTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds = [] } = req.body;
    try {
        const newTeam = yield prisma.team.create({
            data: {
                teamName,
                productOwnerUserId: Number(productOwnerUserId),
                projectManagerUserId: Number(projectManagerUserId),
                members: {
                    create: memberIds.map((id) => ({
                        userId: Number(id)
                    }))
                }
            },
        });
        res.status(201).json(newTeam);
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: `Error creating team: ${errMsg}` });
    }
});
exports.createTeam = createTeam;
// Update team details and manage members in the join table
const updateTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId } = req.params;
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds = [] } = req.body;
    try {
        const teamIdNum = Number(teamId);
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Update team's basic info
            const updatedTeam = yield tx.team.update({
                where: { id: teamIdNum },
                data: {
                    teamName,
                    productOwnerUserId: Number(productOwnerUserId),
                    projectManagerUserId: Number(projectManagerUserId),
                },
            });
            // 2. Clear existing members for this team
            yield tx.teamMembership.deleteMany({
                where: { teamId: teamIdNum }
            });
            // 3. Create new membership records
            if (memberIds.length > 0) {
                yield tx.teamMembership.createMany({
                    data: memberIds.map((id) => ({
                        teamId: teamIdNum,
                        userId: Number(id),
                    })),
                });
            }
            res.status(200).json(updatedTeam);
        }));
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: `Error updating team: ${errMsg}` });
    }
});
exports.updateTeam = updateTeam;
// Delete a team (onDelete: Cascade in the schema will handle TeamMembership)
const deleteTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId } = req.params;
    try {
        // Disassociate the team from any projects first
        yield prisma.projectTeam.deleteMany({
            where: { teamId: Number(teamId) },
        });
        // Now delete the team. The `onDelete: Cascade` in the TeamMembership
        // model will automatically delete all member links.
        yield prisma.team.delete({
            where: { id: Number(teamId) },
        });
        res.status(200).json({ message: `Team ${teamId} deleted successfully.` });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting team: ${error.message}` });
    }
});
exports.deleteTeam = deleteTeam;
