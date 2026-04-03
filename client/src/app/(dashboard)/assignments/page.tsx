"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useGetDeveloperAssignmentsQuery, useGetProjectsQuery, useGetUserByIdQuery, Task, DeveloperAssignmentWithStats } from '@/state/api';
import Header from '@/components/Header';
import { AlertTriangle, Target, ArrowRight, User as UserIcon, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { getProfilePictureSrc } from '@/lib/profilePicture';
import { useRouter } from 'next/navigation';
import ModalViewAllTasks from '@/components/ModalViewAllTasks';
import { useAppSelector } from '@/app/redux';
import { selectCurrentUser } from '@/state/authSlice';

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        'To Do': 'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
        'Work In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        'Under Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
        'Urgent': 'bg-red-500',
        'High': 'bg-orange-500',
        'Medium': 'bg-yellow-500',
        'Low': 'bg-green-500',
        'Backlog': 'bg-gray-400',
    };
    return colors[priority] || 'bg-gray-400';
};

const WorkloadBar = ({ count }: { count: number }) => {
    const pct = Math.min(100, (count / 10) * 100);
    const color = count > 8 ? 'bg-red-500' : count > 5 ? 'bg-amber-500' : 'bg-emerald-500';
    const label = count > 8 ? 'High' : count > 5 ? 'Medium' : 'Low';
    const labelColor = count > 8 ? 'text-red-500' : count > 5 ? 'text-amber-500' : 'text-emerald-500';
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-500">Workload</span>
                <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const DeveloperCard = ({
    dev,
    onViewAll,
    onTaskClick,
}: {
    dev: DeveloperAssignmentWithStats;
    onViewAll: (dev: DeveloperAssignmentWithStats) => void;
    onTaskClick: (task: Task) => void;
}) => (
    <div className="group bg-white dark:bg-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
                {dev.profilePictureUrl ? (
                    <img
                        src={getProfilePictureSrc(dev.profilePictureUrl)!}
                        alt={dev.username || 'Developer'}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg flex-shrink-0"
                    />
                ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm flex-shrink-0">
                        {dev.username?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{dev.username}</h3>
                        {dev.role === 'ADMIN' && (
                            <span className="flex-shrink-0 text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
                                Admin
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{dev.email}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 dark:bg-dark-tertiary p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Target size={12} className="text-blue-500" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Tasks</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{dev.totalTasks}</span>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-dark-tertiary p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertTriangle size={12} className={dev.overdueTasks > 0 ? 'text-red-500' : 'text-gray-400'} />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Overdue</span>
                    </div>
                    <span className={`text-xl font-bold ${dev.overdueTasks > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {dev.overdueTasks}
                    </span>
                </div>
            </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col gap-3">
            {/* Status breakdown */}
            <div className="space-y-1.5">
                {[
                    { label: 'To Do', count: dev.todoTasks, color: 'text-gray-600 dark:text-gray-400' },
                    { label: 'In Progress', count: dev.inProgressTasks, color: 'text-blue-600' },
                    { label: 'Under Review', count: dev.underReviewTasks, color: 'text-amber-600' },
                ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                        <span className={`text-xs font-bold ${color}`}>{count}</span>
                    </div>
                ))}
            </div>

            {/* Top Priority Tasks */}
            {dev.tasks && dev.tasks.length > 0 && (
                <div className="space-y-1.5 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Top Priority</p>
                    {dev.tasks.slice(0, 2).map((task: Task) => {
                        const isOverdue = task.id &&
                            task.dueDate &&
                            task.status !== 'Under Review' &&
                            task.status !== 'Completed' &&
                            new Date(task.dueDate).getTime() > 0 &&
                            isAfter(new Date(), new Date(task.dueDate));

                        return (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className={`relative p-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                                    isOverdue
                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
                                        : 'bg-gray-50 dark:bg-dark-tertiary border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-1 mb-1.5">
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{task.title}</span>
                                    {task.priority && (
                                        <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-0.5 ${getPriorityDot(task.priority)}`} title={task.priority} />
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusBadge(task.status || '')}`}>
                                        {task.status}
                                    </span>
                                    {task.dueDate && (
                                        <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                                            {format(new Date(task.dueDate), 'MMM d')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <WorkloadBar count={dev.totalTasks} />
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
            <button
                onClick={() => onViewAll(dev)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
            >
                View all {dev.totalTasks} tasks
                <ArrowRight size={12} />
            </button>
        </div>
    </div>
);

const Assignments = () => {
    const router = useRouter();
    const currentUser = useAppSelector(selectCurrentUser);
    const userId = currentUser?.userId ?? "";
    const { data: userData, isLoading: userDataLoading } = useGetUserByIdQuery(userId, { skip: !userId });

    const activeUser = userData || currentUser;
    const isAdmin = activeUser?.role === 'ADMIN';

    useEffect(() => {
        if (!userDataLoading && activeUser && !isAdmin) {
            router.push('/unauthorized?required=ADMIN');
        }
    }, [activeUser, isAdmin, router, userDataLoading]);

    const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperAssignmentWithStats | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('all');
    const [sortOption, setSortOption] = useState('username_asc');
    const [limit] = useState(8);

    const { data: assignmentsData, isLoading: assignmentsLoading, isFetching: assignmentsFetching } = useGetDeveloperAssignmentsQuery({
        page, limit, search: searchQuery, filter: filterOption, sort: sortOption
    }, { skip: !isAdmin });

    const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery(undefined, { skip: !isAdmin });

    const developers = assignmentsData?.data || [];
    const meta = assignmentsData?.meta;

    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

    const handleViewAllTasks = (dev: DeveloperAssignmentWithStats) => {
        if (dev.userId) { setSelectedDeveloper(dev); setIsModalOpen(true); }
    };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedDeveloper(null); };
    const handleTaskClick = (task: Task) => { if (task.projectId) router.push(`/projects/${task.projectId}`); };

    if (userDataLoading || assignmentsLoading || projectsLoading) {
        return (
            <div className="p-6 lg:p-8 space-y-6">
                <div className="animate-pulse h-8 w-52 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center justify-between gap-4">
                    <div className="animate-pulse h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="flex gap-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse h-10 w-36 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-4 space-y-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="animate-pulse h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="space-y-2 flex-1">
                                    <div className="animate-pulse h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="animate-pulse h-3 w-36 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="animate-pulse h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                <div className="animate-pulse h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="space-y-2">
                                {[...Array(3)].map((_, j) => <div key={j} className="animate-pulse h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="p-6 lg:p-8">
            <Header name="Developer Assignments" />

            {/* Controls */}
            <div className="mt-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Overview of current developer workloads and task assignments
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search developers..."
                            className="w-full sm:w-56 pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-secondary text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        />
                    </div>

                    {/* Filter & Sort */}
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400 flex-shrink-0" />
                        <select
                            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
                            value={filterOption}
                            onChange={(e) => { setFilterOption(e.target.value); setPage(1); }}
                        >
                            <option value="all">All</option>
                            <option value="overdue">Has Overdue</option>
                        </select>
                        <select
                            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
                            value={sortOption}
                            onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                        >
                            <option value="username_asc">Name A→Z</option>
                            <option value="username_desc">Name Z→A</option>
                            <option value="workload_high">Workload ↓</option>
                            <option value="workload_low">Workload ↑</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Fetching indicator */}
            {assignmentsFetching && (
                <div className="fixed top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg z-50 flex items-center gap-1.5">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    Updating…
                </div>
            )}

            {selectedDeveloper?.userId && (
                <ModalViewAllTasks
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    developer={{
                        userId: selectedDeveloper.userId,
                        username: selectedDeveloper.username || '',
                        email: selectedDeveloper.email || '',
                        profilePictureUrl: selectedDeveloper.profilePictureUrl,
                        role: selectedDeveloper.role
                    }}
                    projects={projectMap}
                />
            )}

            {developers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-dark-secondary mb-4">
                        <UserIcon size={28} className="text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No developers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filter options.</p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {developers.map((dev: DeveloperAssignmentWithStats) => (
                            <DeveloperCard
                                key={dev.userId}
                                dev={dev}
                                onViewAll={handleViewAllTasks}
                                onTaskClick={handleTaskClick}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-center mt-10 gap-3">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                <ChevronLeft size={15} /> Previous
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                                Page {page} of {meta.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                Next <ChevronRight size={15} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Assignments;
