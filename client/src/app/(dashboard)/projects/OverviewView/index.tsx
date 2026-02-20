"use client";

import React, { useState, useMemo } from 'react';
import {
    useGetTasksQuery,
    useGetMilestoneCommentsQuery,
    useCreateMilestoneCommentMutation,
    useGetUsersQuery,
    Task,
    MilestoneComment,
    Project,
} from '@/state/api';
import { useAppSelector } from '@/app/redux';
import { selectCurrentUser } from '@/state/authSlice';
import { format } from 'date-fns';
import { MessageSquare, Send, BarChart3, User as UserIcon, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';

type Props = {
    projectId: number;
    version: number;
    project: Project;
};

const OverviewView = ({ projectId, version, project }: Props) => {
    const loggedInUser = useAppSelector(selectCurrentUser);
    const [commentText, setCommentText] = useState('');

    const { data: tasks = [] } = useGetTasksQuery({ projectId });
    const { data: milestoneComments = [], isLoading: commentsLoading } = useGetMilestoneCommentsQuery(projectId);
    const { data: users = [] } = useGetUsersQuery();
    const [createComment, { isLoading: isCreating }] = useCreateMilestoneCommentMutation();

    // Use all tasks from query (already filtered server-side)
    const activeTasks = useMemo(() => {
        return tasks as Task[];
    }, [tasks]);

    // Task stats
    const stats = useMemo(() => {
        const total = activeTasks.length;
        const todo = activeTasks.filter(t => t.status === 'To Do').length;
        const wip = activeTasks.filter(t => t.status === 'Work In Progress').length;
        const review = activeTasks.filter(t => t.status === 'Under Review').length;
        const completed = activeTasks.filter(t => t.status === 'Completed').length;
        const overdue = activeTasks.filter(t => 
            t.dueDate && 
            new Date(t.dueDate) < new Date() && 
            t.status !== 'Completed'
        ).length;

        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, todo, wip, review, completed, overdue, progressPercent };
    }, [activeTasks]);

    // Look up BO name
    const businessOwner = useMemo(() => {
        if (!project.productOwnerUserId) return null;
        return users.find(u => u.userId === project.productOwnerUserId);
    }, [project.productOwnerUserId, users]);

    const handleSubmitComment = async () => {
        if (!commentText.trim() || isCreating) return;
        try {
            await createComment({ projectId, content: commentText.trim() }).unwrap();
            setCommentText('');
        } catch {
            // Error handling silently
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    const statusBarData = [
        { label: 'To Do', count: stats.todo, color: 'bg-gray-400', pct: stats.total ? (stats.todo / stats.total) * 100 : 0 },
        { label: 'In Progress', count: stats.wip, color: 'bg-blue-500', pct: stats.total ? (stats.wip / stats.total) * 100 : 0 },
        { label: 'Under Review', count: stats.review, color: 'bg-yellow-500', pct: stats.total ? (stats.review / stats.total) * 100 : 0 },
        { label: 'Completed', count: stats.completed, color: 'bg-green-500', pct: stats.total ? (stats.completed / stats.total) * 100 : 0 },
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Top Grid: Project Info + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Info Card */}
                <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Project Info</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Duration</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'N/A'} — {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <UserIcon size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Business Owner</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {businessOwner?.username || 'Not assigned'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <BarChart3 size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Version</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">V{version}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overall Progress Card */}
                <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Overall Progress</h3>
                    
                    {/* Big progress number */}
                    <div className="text-center mb-4">
                        <div className="text-4xl font-bold text-gray-800 dark:text-white">{stats.progressPercent}%</div>
                        <p className="text-xs text-gray-400 mt-1">{stats.completed} of {stats.total} tasks completed</p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-3 bg-gray-100 dark:bg-dark-tertiary rounded-full overflow-hidden flex">
                        {statusBarData.map((item) => (
                            item.pct > 0 && (
                                <div
                                    key={item.label}
                                    className={`${item.color} h-full transition-all duration-500`}
                                    style={{ width: `${item.pct}%` }}
                                    title={`${item.label}: ${item.count}`}
                                />
                            )
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-3">
                        {statusBarData.map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.label} ({item.count})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-4 shadow-sm flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
                        <p className="text-xs text-gray-400 mt-1">Total Tasks</p>
                    </div>
                    <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-4 shadow-sm flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-blue-500">{stats.wip}</div>
                        <p className="text-xs text-gray-400 mt-1">In Progress</p>
                    </div>
                    <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-4 shadow-sm flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-2xl font-bold text-green-500">{stats.completed}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Completed</p>
                    </div>
                    <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-4 shadow-sm flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1">
                            <AlertTriangle size={18} className="text-red-500" />
                            <span className="text-2xl font-bold text-red-500">{stats.overdue}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Overdue</p>
                    </div>
                </div>
            </div>

            {/* Milestone Comments Section */}
            <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary shadow-sm">
                <div className="p-5 border-b border-gray-100 dark:border-dark-tertiary">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-500" />
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Milestone Comments
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                            ({milestoneComments.length})
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Project-level feedback and milestone notes
                    </p>
                </div>

                {/* Comment Input */}
                <div className="p-4 border-b border-gray-100 dark:border-dark-tertiary">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                            {loggedInUser?.profilePictureUrl ? (
                                <Image
                                    src={`/${loggedInUser.profilePictureUrl}`}
                                    alt={loggedInUser.username}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                    {loggedInUser?.username?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <textarea
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
                                placeholder="Add a milestone comment or progress note..."
                                rows={2}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!commentText.trim() || isCreating}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isCreating ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Send size={14} />
                                    )}
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="divide-y divide-gray-100 dark:divide-dark-tertiary max-h-[400px] overflow-y-auto">
                    {commentsLoading ? (
                        <div className="p-8 text-center text-gray-400">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                            Loading comments...
                        </div>
                    ) : milestoneComments.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No milestone comments yet.</p>
                            <p className="text-xs mt-1">Be the first to add a progress note!</p>
                        </div>
                    ) : (
                        milestoneComments.map((comment: MilestoneComment) => (
                            <div key={comment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0">
                                        {comment.user?.profilePictureUrl ? (
                                            <Image
                                                src={`/${comment.user.profilePictureUrl}`}
                                                alt={comment.user.username}
                                                width={32}
                                                height={32}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                                {comment.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                                {comment.user?.username || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(comment.createdAt), 'MMM d, yyyy · h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewView;
