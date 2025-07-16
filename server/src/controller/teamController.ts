import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get teams and their members through the new join table
export const getTeams = async (req: Request, res: Response): Promise<void> => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                members: { include: { user: true } },
            }
        });

        // Manually fetch usernames for PO and PM since relations are removed
        const userIds = [
            ...new Set(teams.map(team => team.productOwnerUserId)),
            ...new Set(teams.map(team => team.projectManagerUserId))
        ].filter(id => id != null);

        const users = await prisma.user.findMany({
            where: { userId: { in: userIds as number[] } },
            select: { userId: true, username: true }
        });
        
        const userMap = new Map(users.map(u => [u.userId, u.username]));

        const teamsWithDetails = teams.map(team => ({
            ...team,
            users: team.members.map(m => m.user),
            productOwnerUsername: team.productOwnerUserId ? userMap.get(team.productOwnerUserId) : null,
            projectManagerUsername: team.projectManagerUserId ? userMap.get(team.projectManagerUserId) : null,
            memberCount: team.members.length,
        }));

        res.json(teamsWithDetails);
    } catch (error: any) {
        res.status(500).json({ message: `Error retrieving teams: ${error.message}` });
    }
};
// Create a team and create entries in the join table
export const createTeam = async (req: Request, res: Response): Promise<void> => {
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds = [] } = req.body;
    try {
        const newTeam = await prisma.team.create({
            data: {
                teamName,
                productOwnerUserId: Number(productOwnerUserId),
                projectManagerUserId: Number(projectManagerUserId),
                members: {
                    create: memberIds.map((id: number) => ({
                        userId: Number(id)
                    }))
                }
            },
        });
        res.status(201).json(newTeam);
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: `Error creating team: ${errMsg}` });
    }
};

// Update team details and manage members in the join table
export const updateTeam = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds = [] } = req.body;
    try {
        const teamIdNum = Number(teamId);

        await prisma.$transaction(async (tx) => {
            // 1. Update team's basic info
            const updatedTeam = await tx.team.update({
                where: { id: teamIdNum },
                data: {
                    teamName,
                    productOwnerUserId: Number(productOwnerUserId),
                    projectManagerUserId: Number(projectManagerUserId),
                },
            });
            
            // 2. Clear existing members for this team
            await tx.teamMembership.deleteMany({
                where: { teamId: teamIdNum }
            });

            // 3. Create new membership records
            if (memberIds.length > 0) {
                await tx.teamMembership.createMany({
                    data: memberIds.map((id: number) => ({
                        teamId: teamIdNum,
                        userId: Number(id),
                    })),
                });
            }

            res.status(200).json(updatedTeam);
        });

    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: `Error updating team: ${errMsg}` });
    }
};

// Delete a team (onDelete: Cascade in the schema will handle TeamMembership)
export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
    try {
        // Disassociate the team from any projects first
        await prisma.projectTeam.deleteMany({
            where: { teamId: Number(teamId) },
        });

        // Now delete the team. The `onDelete: Cascade` in the TeamMembership
        // model will automatically delete all member links.
        await prisma.team.delete({
            where: { id: Number(teamId) },
        });
        res.status(200).json({ message: `Team ${teamId} deleted successfully.` });
    } catch (error: any) {
        res.status(500).json({ message: `Error deleting team: ${error.message}` });
    }
};