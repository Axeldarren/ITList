import { PrismaClient, NotificationType } from "@prisma/client";
import { broadcast } from "../websocket";

const prisma = new PrismaClient();

/**
 * Parse @username mentions from text.
 * Returns an array of unique usernames found.
 */
export function parseMentions(text: string): string[] {
    const regex = /@(\w+)/g;
    const mentions = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
        mentions.add(match[1]);
    }
    return Array.from(mentions);
}

/**
 * Resolve usernames to user IDs.
 * Returns a map of username -> userId for valid users.
 */
export async function resolveUsernames(
    usernames: string[]
): Promise<Map<string, string>> {
    if (usernames.length === 0) return new Map();

    const users = await prisma.user.findMany({
        where: {
            username: { in: usernames },
            deletedAt: null,
        },
        select: { userId: true, username: true },
    });

    const map = new Map<string, string>();
    for (const u of users) {
        map.set(u.username, u.userId);
    }
    return map;
}

interface CreateNotificationParams {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    taskId?: number;
    projectId?: number;
    commentId?: number;
}

/**
 * Create a single notification and return it.
 */
export async function createNotification(
    params: CreateNotificationParams
) {
    console.log(`Creating notification [${params.type}] for user ${params.userId}: ${params.title}`);
    return prisma.notification.create({
        data: {
            type: params.type,
            title: params.title,
            message: params.message,
            userId: params.userId,
            taskId: params.taskId ?? null,
            projectId: params.projectId ?? null,
            commentId: params.commentId ?? null,
        },
    });
}

/**
 * Create MENTIONED notifications for all mentioned users.
 * Returns the set of user IDs that were notified.
 */
export async function createMentionNotifications(opts: {
    text: string;
    authorUserId: string;
    authorUsername: string;
    taskId?: number;
    projectId?: number;
    commentId?: number;
    contextLabel: string; // e.g., "task \"Fix bug\"" or "project \"Alpha\""
}): Promise<Set<string>> {
    const mentionedUsernames = parseMentions(opts.text);
    if (mentionedUsernames.length === 0) return new Set();

    const usernameToId = await resolveUsernames(mentionedUsernames);
    const notifiedIds = new Set<string>();

    for (const [, userId] of usernameToId) {
        // Don't notify the author about their own mention
        if (userId === opts.authorUserId) continue;

        await createNotification({
            type: NotificationType.MENTIONED,
            title: "You were mentioned",
            message: `${opts.authorUsername} mentioned you in a comment on ${opts.contextLabel}.`,
            userId,
            taskId: opts.taskId,
            projectId: opts.projectId,
            commentId: opts.commentId,
        });

        notifiedIds.add(userId);
    }

    return notifiedIds;
}

/**
 * Broadcast a generic NOTIFICATION WebSocket message
 * so all connected clients refetch their notification data.
 */
export function broadcastNotificationUpdate(): void {
    broadcast({ type: "NOTIFICATION" });
}
