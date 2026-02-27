"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Clock, AlertTriangle, AlertCircle, MessageSquare, Milestone, AtSign, Check, CheckCheck, X } from "lucide-react";
import {
    useGetNotificationsQuery,
    useGetUnreadNotificationCountQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    useDeleteNotificationMutation,
    Notification,
    NotificationType,
} from "@/state/api";
import { useRouter } from "next/navigation";
import MentionHighlighter from "@/components/MentionHighlighter";

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

export function getNotificationIcon(type: NotificationType) {
    switch (type) {
        case NotificationType.TASK_DEADLINE_APPROACHING:
            return <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />;
        case NotificationType.TASK_OVERDUE:
            return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
        case NotificationType.PROJECT_AT_RISK:
            return <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />;
        case NotificationType.COMMENT_ADDED:
            return <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />;
        case NotificationType.MILESTONE_COMMENT_ADDED:
            return <Milestone className="h-4 w-4 text-purple-500 flex-shrink-0" />;
        case NotificationType.MENTIONED:
            return <AtSign className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
        default:
            return <Bell className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    }
}

export function getNotificationAccentColor(type: NotificationType): string {
    switch (type) {
        case NotificationType.TASK_DEADLINE_APPROACHING:
            return "border-l-amber-500";
        case NotificationType.TASK_OVERDUE:
            return "border-l-red-500";
        case NotificationType.PROJECT_AT_RISK:
            return "border-l-orange-500";
        case NotificationType.COMMENT_ADDED:
            return "border-l-blue-500";
        case NotificationType.MILESTONE_COMMENT_ADDED:
            return "border-l-purple-500";
        case NotificationType.MENTIONED:
            return "border-l-emerald-500";
        default:
            return "border-l-gray-400";
    }
}

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
        pollingInterval: 60000, // Poll every 60 seconds as fallback
    });
    const { data: notificationsData, isFetching: isNotificationsFetching } = useGetNotificationsQuery(
        { page: 1, limit: 15, category: activeCategory },
        { skip: !isOpen } // Only fetch when dropdown is open
    );

    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const unreadCount = unreadData?.count ?? 0;
    const notifications = notificationsData?.data ?? [];

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        // Smart routing based on notification type
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

        setIsOpen(false);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const handleViewAll = () => {
        setIsOpen(false);
        router.push("/notifications");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="relative p-1.5 md:p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-white/5"
            >
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm animate-in fade-in">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 max-h-[480px] rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-dark-secondary z-50 overflow-hidden flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 dark:border-white/10">
                        {["all", "unread", "mentions"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors border-b-2 ${
                                    activeCategory === cat
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Header (optional summary) */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                            {activeCategory} notifications
                        </span>
                        {unreadCount > 0 && activeCategory !== 'mentions' && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                <CheckCheck className="h-3 w-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                        {isNotificationsFetching ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                    <Bell className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    No {activeCategory === 'all' ? '' : activeCategory} notifications
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-white/5">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`
                                            group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                                            border-l-[3px]
                                            ${getNotificationAccentColor(notification.type)}
                                            ${notification.isRead
                                                ? "bg-white dark:bg-transparent opacity-70 hover:opacity-100"
                                                : "bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                            }
                                        `}
                                    >
                                        {/* Icon */}
                                        <div className="mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={`text-sm leading-snug ${
                                                        notification.isRead
                                                            ? "text-gray-600 dark:text-gray-400"
                                                            : "text-gray-900 dark:text-white font-medium"
                                                    }`}
                                                >
                                                    {notification.title}
                                                </p>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="h-3.5 w-3.5 text-gray-400" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDelete(e, notification.id)}
                                                        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete"
                                                    >
                                                        <X className="h-3.5 w-3.5 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                <MentionHighlighter text={notification.message} />
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                                {getRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View All Footer */}
                    <div className="border-t border-gray-100 dark:border-white/10">
                        <button
                            onClick={handleViewAll}
                            className="w-full py-2.5 text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-gray-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-white/5 transition-colors"
                        >
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
