import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- Get Teams (No Changes) ---
export const getTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        // Correct relation name is 'user' (singular) as per your schema
        user: true, 
      },
    });

    // Manually fetch usernames for PO and PM to avoid relation errors
    const userIds = [
      ...new Set(teams.flatMap(team => [team.productOwnerUserId, team.projectManagerUserId]))
    ].filter(id => id != null);

    const users = await prisma.user.findMany({
        where: { userId: { in: userIds as number[] } },
        select: { userId: true, username: true }
    });
    
    const userMap = new Map(users.map(u => [u.userId, u.username]));

    const teamsWithDetails = teams.map(team => ({
      ...team,
      productOwnerUsername: team.productOwnerUserId ? userMap.get(team.productOwnerUserId) : null,
      projectManagerUsername: team.projectManagerUserId ? userMap.get(team.projectManagerUserId) : null,
      memberCount: team.user.length,
      // Rename 'user' to 'users' for frontend consistency
      users: team.user, 
    }));

    res.json(teamsWithDetails);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving teams: ${error.message}` });
  }
};


// --- UPDATED: Create a Team and Assign Users ---
export const createTeam = async (req: Request, res: Response): Promise<void> => {
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds } = req.body;
    try {
        const newTeam = await prisma.team.create({
            data: {
                teamName,
                productOwnerUserId: Number(productOwnerUserId),
                projectManagerUserId: Number(projectManagerUserId),
            },
        });

        // If member IDs are provided, update those users to be part of the new team
        if (memberIds && memberIds.length > 0) {
            await prisma.user.updateMany({
                where: { userId: { in: memberIds.map((id: number | string) => Number(id)) } },
                data: { teamId: newTeam.id },
            });
        }

        res.status(201).json(newTeam);
    } catch (error) {
        res.status(500).json({ message: `Error creating team: ${error}` });
    }
};

// --- UPDATED: Update a Team and its Members ---
export const updateTeam = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
    const { teamName, productOwnerUserId, projectManagerUserId, memberIds } = req.body;
    try {
        const teamIdNum = Number(teamId);

        await prisma.$transaction(async (tx) => {
            // 1. Update the team's basic info
            const updatedTeam = await tx.team.update({
                where: { id: teamIdNum },
                data: {
                    teamName,
                    productOwnerUserId: Number(productOwnerUserId),
                    projectManagerUserId: Number(projectManagerUserId),
                },
            });

            // 2. Get the list of users currently in the team
            const currentMembers = await tx.user.findMany({
                where: { teamId: teamIdNum },
                select: { userId: true },
            });
            const currentMemberIds = currentMembers.map(u => u.userId);

            // 3. Unassign users who are no longer in the team
            const usersToRemove = currentMemberIds.filter(id => !memberIds.includes(id));
            if (usersToRemove.length > 0) {
                await tx.user.updateMany({
                    where: { userId: { in: usersToRemove } },
                    data: { teamId: null },
                });
            }

            // 4. Assign new users to the team
            if (memberIds && memberIds.length > 0) {
                await tx.user.updateMany({
                    where: { userId: { in: memberIds.map((id: number | string) => Number(id)) } },
                    data: { teamId: teamIdNum },
                });
            }

            res.status(200).json(updatedTeam);
        });
    } catch (error) {
        res.status(500).json({ message: `Error updating team: ${error}` });
    }
};

// --- Delete Team (No Changes to logic, but it's important for context) ---
export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
    try {
        await prisma.projectTeam.deleteMany({ where: { teamId: Number(teamId) } });
        await prisma.user.updateMany({ where: { teamId: Number(teamId) }, data: { teamId: null } });
        await prisma.team.delete({ where: { id: Number(teamId) } });
        res.status(200).json({ message: `Team ${teamId} deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: `Error deleting team: ${error}` });
    }
};