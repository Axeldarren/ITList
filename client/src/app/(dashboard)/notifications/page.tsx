"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Check, X, ChevronLeft } from "lucide-react";
import {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    useDeleteNotificationMutation,
    Notification,
    NotificationType,
} from "@/state/api";
import {
    getNotificationIcon,
    getNotificationAccentColor,
} from "@/components/NotificationBell";
import { useRouter } from "next/navigation";
import MentionHighlighter from "@/components/MentionHighlighter";

const CATEGORIES = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "mentions", label: "Mentions" },
] as const;

function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

const NotificationsPage = () => {
    const [category, setCategory] = useState<string>("all");
    const [page, setPage] = useState(1);
    const limit = 20;

    const router = useRouter();

    const { data, isLoading, isFetching } = useGetNotificationsQuery(
        { page, limit, category },
        { refetchOnMountOrArgChange: true }
    );
    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const notifications = data?.data ?? [];
    const meta = data?.meta;
    const totalPages = meta?.totalPages ?? 1;

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        
        const type = notification.type;
        const pid = notification.projectId;
        const tid = notification.taskId;

        if (
            (type === NotificationType.COMMENT_ADDED || type === NotificationType.MENTIONED) &&
            tid && pid
        ) {
            // Open task modal on Discussion tab
            router.push(`/projects/${pid}?taskId=${tid}&tab=discussion`);
        } else if (type === NotificationType.MILESTONE_COMMENT_ADDED && pid) {
            router.push(`/projects/${pid}?tab=overview`);
        } else if (
            (type === NotificationType.TASK_DEADLINE_APPROACHING || type === NotificationType.TASK_OVERDUE) &&
            tid && pid
        ) {
            router.push(`/projects/${pid}?taskId=${tid}`);
        } else if (pid) {
            router.push(`/projects/${pid}`);
        }
    };

    const handleCategoryChange = (cat: string) => {
        setCategory(cat);
        setPage(1); // Reset to first page on category change
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            Notifications
                        </h1>
                        {meta && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {meta.total} notification{meta.total !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-colors"
                >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => handleCategoryChange(cat.key)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${category === cat.key
                                ? "bg-white dark:bg-dark-secondary text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }
                        `}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-secondary overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                            <Bell className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                            No notifications
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            {category === "all"
                                ? "You're all caught up!"
                                : `No ${category} notifications yet.`}
                        </p>
                    </div>
                ) : (
                    <div className={`divide-y divide-gray-100 dark:divide-white/5 ${isFetching ? "opacity-60" : ""}`}>
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`
                                    group flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors
                                    border-l-[3px]
                                    ${getNotificationAccentColor(notification.type)}
                                    ${notification.isRead
                                        ? "bg-white dark:bg-transparent opacity-70 hover:opacity-100"
                                        : "bg-blue-50/40 dark:bg-blue-500/5 hover:bg-blue-50/70 dark:hover:bg-blue-500/10"
                                    }
                                `}
                            >
                                {/* Icon */}
                                <div className="mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p
                                                className={`text-sm leading-snug ${
                                                    notification.isRead
                                                        ? "text-gray-600 dark:text-gray-400"
                                                        : "text-gray-900 dark:text-white font-medium"
                                                }`}
                                            >
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                <MentionHighlighter text={notification.message} />
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                                {getRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-4 w-4 text-gray-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10"
                                                title="Delete"
                                            >
                                                <X className="h-4 w-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
