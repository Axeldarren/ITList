import cron from "node-cron";
import { PrismaClient, NotificationType } from "@prisma/client";
import { broadcast } from "../websocket";

const prisma = new PrismaClient();

/**
 * Check for tasks nearing their deadline (within 24 hours)
 * and create TASK_DEADLINE_APPROACHING notifications.
 * Only creates one notification per task+user (deduplication).
 */
async function checkDeadlineApproaching(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within 24h, not completed, not deleted, with an assignee
    const tasks = await prisma.task.findMany({
        where: {
            dueDate: {
                gte: now,
                lte: in24h,
            },
            status: { not: "Completed" },
            deletedAt: null,
            assignedUserId: { not: null },
        },
        include: {
            project: { select: { name: true } },
            assignee: { select: { userId: true, username: true } },
        },
    });

    const notifiedUserIds = new Set<string>();

    for (const task of tasks) {
        if (!task.assignedUserId) continue;

        // Check if notification already exists for this task+user+type
        const existing = await prisma.notification.findFirst({
            where: {
                type: NotificationType.TASK_DEADLINE_APPROACHING,
                taskId: task.id,
                userId: task.assignedUserId,
            },
        });

        if (existing) continue;

        await prisma.notification.create({
            data: {
                type: NotificationType.TASK_DEADLINE_APPROACHING,
                title: "Task Deadline Approaching",
                message: `Task "${task.title}" in project "${task.project.name}" is due within 24 hours.`,
                userId: task.assignedUserId,
                taskId: task.id,
                projectId: task.projectId,
            },
        });

        notifiedUserIds.add(task.assignedUserId);
    }

    return broadcastToUsers(notifiedUserIds);
}

/**
 * Check for overdue tasks and create TASK_OVERDUE notifications.
 * Only creates one notification per task+user (deduplication).
 */
async function checkOverdueTasks(): Promise<void> {
    const now = new Date();

    // Find tasks past due date, not completed, not deleted, with an assignee
    const tasks = await prisma.task.findMany({
        where: {
            dueDate: { lt: now },
            status: { not: "Completed" },
            deletedAt: null,
            assignedUserId: { not: null },
        },
        include: {
            project: { select: { name: true } },
            assignee: { select: { userId: true, username: true } },
        },
    });

    const notifiedUserIds = new Set<string>();

    for (const task of tasks) {
        if (!task.assignedUserId) continue;

        const existing = await prisma.notification.findFirst({
            where: {
                type: NotificationType.TASK_OVERDUE,
                taskId: task.id,
                userId: task.assignedUserId,
            },
        });

        if (existing) continue;

        await prisma.notification.create({
            data: {
                type: NotificationType.TASK_OVERDUE,
                title: "Task Overdue",
                message: `Task "${task.title}" in project "${task.project.name}" is past its deadline.`,
                userId: task.assignedUserId,
                taskId: task.id,
                projectId: task.projectId,
            },
        });

        notifiedUserIds.add(task.assignedUserId);
    }

    return broadcastToUsers(notifiedUserIds);
}

/**
 * Check for projects at risk (projects with overdue incomplete tasks)
 * and notify admins + product owners.
 * Only creates one notification per project+user (deduplication).
 */
async function checkProjectsAtRisk(): Promise<void> {
    const now = new Date();

    // Find projects in Start/OnProgress with overdue incomplete tasks
    const atRiskProjects = await prisma.project.findMany({
        where: {
            status: { in: ["Start", "OnProgress"] },
            deletedAt: null,
            tasks: {
                some: {
                    dueDate: { lt: now },
                    status: { not: "Completed" },
                    deletedAt: null,
                },
            },
        },
        include: {
            tasks: {
                where: {
                    dueDate: { lt: now },
                    status: { not: "Completed" },
                    deletedAt: null,
                },
                select: { id: true, title: true },
            },
        },
    });

    if (atRiskProjects.length === 0) return;

    // Get all admin users
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN", deletedAt: null },
        select: { userId: true },
    });

    const notifiedUserIds = new Set<string>();

    for (const project of atRiskProjects) {
        // Collect recipients: admins + product owner
        const recipientIds = new Set(admins.map((a) => a.userId));
        if (project.productOwnerUserId) {
            recipientIds.add(project.productOwnerUserId);
        }

        const overdueCount = project.tasks.length;

        for (const recipientId of recipientIds) {
            const existing = await prisma.notification.findFirst({
                where: {
                    type: NotificationType.PROJECT_AT_RISK,
                    projectId: project.id,
                    userId: recipientId,
                },
            });

            if (existing) continue;

            await prisma.notification.create({
                data: {
                    type: NotificationType.PROJECT_AT_RISK,
                    title: "Project At Risk",
                    message: `Project "${project.name}" has ${overdueCount} overdue task${overdueCount > 1 ? "s" : ""} that may delay completion.`,
                    userId: recipientId,
                    projectId: project.id,
                },
            });

            notifiedUserIds.add(recipientId);
        }
    }

    return broadcastToUsers(notifiedUserIds);
}

/**
 * Broadcast a NOTIFICATION message via WebSocket to inform
 * connected clients that they have new notifications.
 */
function broadcastToUsers(userIds: Set<string>): void {
    if (userIds.size === 0) return;
    // Broadcast a generic notification update message.
    // The client-side WebSocket listener will invalidate
    // the Notifications cache so the bell icon re-fetches.
    broadcast({ type: "NOTIFICATION" });
}

/**
 * Run all notification checks once (used by scheduler and manual trigger).
 */
export async function runNotificationChecks(): Promise<void> {
    console.log("[NotificationScheduler] Running notification checks...");
    try {
        await checkDeadlineApproaching();
        await checkOverdueTasks();
        await checkProjectsAtRisk();
        console.log("[NotificationScheduler] Notification checks completed.");
    } catch (error) {
        console.error("[NotificationScheduler] Error during notification checks:", error);
    }
}

/**
 * Start the notification scheduler cron job.
 * Runs every hour at minute 0.
 */
export function startNotificationScheduler(): void {
    // Run immediately on startup
    runNotificationChecks();

    // Schedule to run every hour
    cron.schedule("0 * * * *", () => {
        runNotificationChecks();
    });

    console.log("[NotificationScheduler] Scheduler started — runs every hour.");
}
