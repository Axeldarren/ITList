import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcast } from "../websocket";

const prisma = new PrismaClient();

// Get teams and their members through the new join table
export const getTeams = async (req: Request, res: Response): Promise<void> => {
    try {
        const teams = await prisma.team.findMany({
            where: { deletedAt: null }, // Only find teams that have not been deleted
            include: {
                members: { include: { user: true } },
                createdBy: { select: { username: true } },
            }
        });
        
        const userIds = [ /* ... */ ];
        const users = await prisma.user.findMany({ /* ... */ });
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
    const loggedInUser = req.user;

    try {
        const newTeam = await prisma.team.create({
            data: {
                teamName,
                productOwnerUserId: productOwnerUserId,
                projectManagerUserId: projectManagerUserId,
                createdById: loggedInUser?.userId,
                updatedById: loggedInUser?.userId, // The creator is the first updater
                members: {
                    create: memberIds.map((id: string) => ({
                        userId: id
                    }))
                }
            },
        });

        broadcast({ type: 'TEAM_UPDATE' });
        
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
    const loggedInUser = req.user;
    
    try {
        const teamIdNum = Number(teamId);

        const updatedTeam = await prisma.$transaction(async (tx) => {
            const team = await tx.team.update({
                where: { id: teamIdNum },
                data: {
                    teamName,
                    productOwnerUserId: productOwnerUserId,
                    projectManagerUserId: projectManagerUserId,
                    updatedById: loggedInUser?.userId, // Stamp the updater
                },
            });
            
            await tx.teamMembership.deleteMany({ where: { teamId: teamIdNum } });

            if (memberIds.length > 0) {
                await tx.teamMembership.createMany({
                    data: memberIds.map((id: string) => ({
                        teamId: teamIdNum,
                        userId: id,
                    })),
                });
            }

            return team;
        });

        // Broadcast after transaction completes successfully
        broadcast({ type: 'TEAM_UPDATE' });
        res.status(200).json(updatedTeam);

    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: `Error updating team: ${errMsg}` });
    }
};

// Delete a team (onDelete: Cascade in the schema will handle TeamMembership)
export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
    const loggedInUser = req.user;

    try {
        await prisma.team.update({
            where: { id: Number(teamId) },
            data: {
                deletedAt: new Date(),
                deletedById: loggedInUser?.userId,
            },
        });

        broadcast({ type: 'TEAM_UPDATE' });
        
        res.status(200).json({ message: `Team ${teamId} archived successfully.` });
    } catch (error: any) {
        res.status(500).json({ message: `Error archiving team: ${error.message}` });
    }
};