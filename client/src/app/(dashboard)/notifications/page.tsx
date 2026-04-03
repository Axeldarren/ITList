"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import ModalConfirm from "@/components/ModalConfirm";
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
    const [deletingId, setDeletingId] = useState<number | null>(null);
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
        if (!notification.isRead) await markAsRead(notification.id);

        const type = notification.type;
        const pid = notification.projectId;
        const tid = notification.taskId;

        if ((type === NotificationType.COMMENT_ADDED || type === NotificationType.MENTIONED) && tid && pid) {
            router.push(`/projects/${pid}?taskId=${tid}&tab=discussion`);
        } else if (type === NotificationType.MILESTONE_COMMENT_ADDED && pid) {
            router.push(`/projects/${pid}?tab=overview`);
        } else if ((type === NotificationType.TASK_DEADLINE_APPROACHING || type === NotificationType.TASK_OVERDUE) && tid && pid) {
            router.push(`/projects/${pid}?taskId=${tid}`);
        } else if (pid) {
            router.push(`/projects/${pid}`);
        }
    };

    const handleCategoryChange = (cat: string) => {
        setCategory(cat);
        setPage(1);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <>
        <ModalConfirm
            isOpen={deletingId !== null}
            onClose={() => setDeletingId(null)}
            onConfirm={() => { deleteNotification(deletingId!); setDeletingId(null); }}
            title="Delete Notification"
            message="This notification will be permanently removed."
        />
        <div className="flex flex-col gap-5 p-6 md:p-8 max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-secondary transition-colors cursor-pointer"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-blue-primary text-white text-[10px] font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {meta && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {meta.total} notification{meta.total !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => handleCategoryChange(cat.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                            category === cat.key
                                ? "bg-white dark:bg-dark-secondary text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-secondary overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 px-5 py-4">
                                <div className="animate-pulse h-9 w-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <div className="animate-pulse h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="animate-pulse h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="animate-pulse h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-dark-tertiary mb-4">
                            <Bell className="h-7 w-7 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {category === "all" ? "All caught up!" : `No ${category} notifications`}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {category === "all"
                                ? "New notifications will appear here."
                                : `You have no ${category} notifications yet.`}
                        </p>
                    </div>
                ) : (
                    <div className={`divide-y divide-gray-100 dark:divide-gray-800 transition-opacity duration-200 ${isFetching ? "opacity-50" : ""}`}>
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`group relative flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors duration-150 border-l-[3px] ${getNotificationAccentColor(notification.type)} ${
                                    notification.isRead
                                        ? "hover:bg-gray-50 dark:hover:bg-white/5"
                                        : "bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                }`}
                            >
                                {/* Unread dot */}
                                {!notification.isRead && (
                                    <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                )}

                                {/* Icon */}
                                <div className="mt-0.5 flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pr-6">
                                    <p className={`text-sm leading-snug mb-0.5 ${
                                        notification.isRead
                                            ? "text-gray-600 dark:text-gray-400"
                                            : "text-gray-900 dark:text-white font-semibold"
                                    }`}>
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                        <MentionHighlighter text={notification.message} />
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                                        {getRelativeTime(notification.createdAt)}
                                    </p>
                                </div>

                                {/* Actions (show on hover) */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                            title="Mark as read"
                                        >
                                            <Check className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeletingId(notification.id); }}
                                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                        title="Delete"
                                    >
                                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <ChevronLeft size={15} /> Previous
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        Next <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
        </>
    );
};

export default NotificationsPage;
