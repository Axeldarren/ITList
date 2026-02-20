"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
    useGetProjectsQuery,
    useGetAllTasksQuery,
    useGetMilestoneCommentsQuery,
    useGetProductMaintenancesQuery,
    Task,
    ProductMaintenance,
} from '@/state/api';
import { useAppSelector } from '@/app/redux';
import { selectCurrentUser } from '@/state/authSlice';
import { differenceInDays, format } from 'date-fns';
import {
    Briefcase, TrendingUp, AlertTriangle, CheckCircle,
    Clock, BarChart3, MessageSquare, ArrowRight,
    FolderOpen, Wrench, Shield,
} from 'lucide-react';
import Header from '@/components/Header';
import { StatsSkeleton, CardSkeleton } from '@/components/Skeleton';
import { InlineLoading } from '@/components/LoadingSpinner';

const BusinessOwnerHome = () => {
    const loggedInUser = useAppSelector(selectCurrentUser);
    const userId = loggedInUser?.userId;

    const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
    const { data: allTasks = [], isLoading: allTasksLoading } = useGetAllTasksQuery();
    const { data: maintenancesResponse, isLoading: maintenancesLoading } = useGetProductMaintenancesQuery({ page: 1, limit: 100 });
    const maintenances = useMemo(() => maintenancesResponse?.data || [], [maintenancesResponse]);

    // Get projects owned by this BO
    const myProjects = useMemo(() => {
        return projects.filter(p => p.productOwnerUserId === userId && !p.deletedAt);
    }, [projects, userId]);

    // Process projects with task stats
    const processedProjects = useMemo(() => {
        const now = new Date();
        return myProjects.map(project => {
            const projectTasks = allTasks.filter((t: Task) => t.projectId === project.id);
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter((t: Task) => t.status === 'Completed').length;
            const inProgressTasks = projectTasks.filter((t: Task) => t.status === 'Work In Progress').length;
            const overdueTasks = projectTasks.filter((t: Task) => 
                t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed'
            ).length;
            const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const daysRemaining = project.endDate ? differenceInDays(new Date(project.endDate), now) : 0;
            const isOverdue = project.endDate ? new Date(project.endDate) < now : false;

            return {
                ...project,
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                percentage,
                daysRemaining,
                isOverdue,
                ticket_id: project.ticket_id || project.projectTicket?.ticket_id || '',
            };
        });
    }, [myProjects, allTasks]);

    // Summary stats
    const stats = useMemo(() => {
        const totalProjects = processedProjects.length;
        const activeProjects = processedProjects.filter(p => p.status !== 'Finish' && p.status !== 'Cancel').length;
        const completedProjects = processedProjects.filter(p => p.status === 'Finish').length;
        const atRiskProjects = processedProjects.filter(p => p.isOverdue && p.status !== 'Finish' && p.status !== 'Cancel').length;
        const avgProgress = totalProjects > 0 
            ? Math.round(processedProjects.reduce((sum, p) => sum + p.percentage, 0) / totalProjects) 
            : 0;

        return { totalProjects, activeProjects, completedProjects, atRiskProjects, avgProgress };
    }, [processedProjects]);

    const activeProjectsSorted = useMemo(() => {
        return processedProjects
            .filter(p => p.status !== 'Finish' && p.status !== 'Cancel')
            .sort((a, b) => {
                // Overdue first, then by days remaining ascending
                if (a.isOverdue && !b.isOverdue) return -1;
                if (!a.isOverdue && b.isOverdue) return 1;
                return a.daysRemaining - b.daysRemaining;
            });
    }, [processedProjects]);

    // Product Maintenances linked to BO's projects
    const myMaintenances = useMemo(() => {
        const items = maintenancesResponse?.data || [];
        const myProjectIds = new Set(myProjects.map(p => p.id));
        return items.filter((m: ProductMaintenance) => m.projectId && myProjectIds.has(m.projectId));
    }, [maintenancesResponse, myProjects]);

    const isLoading = projectsLoading || allTasksLoading || maintenancesLoading;

    if (isLoading) {
        return (
            <div className="h-full w-full bg-transparent p-8 page-fade-in">
                <div className="mb-8">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded skeleton mb-4"></div>
                    <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                </div>
                <StatsSkeleton />
                <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <InlineLoading height="300px" text="Loading projects..." />
                    <div className="space-y-4">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Start': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            case 'OnProgress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Resolve': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'Finish': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'Cancel': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getProgressBarColor = (percentage: number, isOverdue: boolean) => {
        if (isOverdue) return 'bg-red-500';
        if (percentage >= 75) return 'bg-green-500';
        if (percentage >= 50) return 'bg-blue-500';
        if (percentage >= 25) return 'bg-yellow-500';
        return 'bg-gray-400';
    };

    return (
        <div className="h-full w-full bg-transparent p-8 page-fade-in">
            <Header name={`Hi, ${loggedInUser?.username}`} />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Briefcase size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalProjects}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Projects</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.activeProjects}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Active Projects</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.atRiskProjects}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Projects Overdue</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <BarChart3 size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.avgProgress}%</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Progress</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Project Cards - Takes 2 cols */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <FolderOpen size={20} />
                            My Projects
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {activeProjectsSorted.length} active
                        </span>
                    </div>

                    {activeProjectsSorted.length === 0 ? (
                        <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-8 text-center">
                            <FolderOpen size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="text-gray-500 dark:text-gray-400">No active projects assigned to you yet.</p>
                        </div>
                    ) : (
                        activeProjectsSorted.map(project => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="block bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                            >
                                {/* Project Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </h3>
                                            {project.ticket_id && (
                                                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded flex-shrink-0">
                                                    #{project.ticket_id}
                                                </span>
                                            )}
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                                {project.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(project.status)}`}>
                                            {project.status === 'OnProgress' ? 'In Progress' : project.status}
                                        </span>
                                        <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-2.5 flex-1 rounded-full bg-gray-100 dark:bg-dark-tertiary overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(project.percentage, project.isOverdue)}`}
                                            style={{ width: `${project.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[40px] text-right">
                                        {project.percentage}%
                                    </span>
                                </div>

                                {/* Stats Row */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle size={13} className="text-green-500" />
                                        <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={13} className="text-blue-500" />
                                        <span>{project.inProgressTasks} in progress</span>
                                    </div>
                                    {project.overdueTasks > 0 && (
                                        <div className="flex items-center gap-1">
                                            <AlertTriangle size={13} className="text-red-500" />
                                            <span className="text-red-500 font-medium">{project.overdueTasks} overdue</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 ml-auto">
                                        <Clock size={13} />
                                        {project.isOverdue ? (
                                            <span className="text-red-500 font-medium">{Math.abs(project.daysRemaining)} days overdue</span>
                                        ) : (
                                            <span>{project.daysRemaining} days left</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}

                    {/* Completed Projects Summary */}
                    {processedProjects.filter(p => p.status === 'Finish').length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800/30 p-4">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle size={18} />
                                <span className="text-sm font-medium">
                                    {stats.completedProjects} project{stats.completedProjects > 1 ? 's' : ''} completed
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Product Maintenance Overview */}
                    {myMaintenances.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mt-6 mb-2">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Wrench size={20} />
                                    Product Maintenance
                                </h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {myMaintenances.length} item{myMaintenances.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {myMaintenances.map((m: ProductMaintenance) => (
                                <div
                                    key={m.id}
                                    className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Shield size={16} className="text-indigo-500 flex-shrink-0" />
                                                <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                                                    {m.name}
                                                </h3>
                                            </div>
                                            {m.project && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                                                    Project: {m.project.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                                m.lifecycle === 'Maintaining' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                m.lifecycle === 'Finished' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {m.lifecycle || 'Planned'}
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                m.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                                {m.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        {m.priority && (
                                            <div className="flex items-center gap-1">
                                                <AlertTriangle size={13} className={
                                                    m.priority === 'Critical' ? 'text-red-500' :
                                                    m.priority === 'High' ? 'text-orange-500' :
                                                    m.priority === 'Medium' ? 'text-yellow-500' : 'text-gray-400'
                                                } />
                                                <span>{m.priority} priority</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <CheckCircle size={13} className="text-blue-500" />
                                            <span>{m._count?.maintenanceTasks || m.maintenanceTasks?.length || 0} tasks</span>
                                        </div>
                                        {m.maintainers && m.maintainers.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span>{m.maintainers.length} maintainer{m.maintainers.length > 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 ml-auto">
                                            <Clock size={13} />
                                            <span>Updated {format(new Date(m.updatedAt), 'MMM d')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Recent Milestone Comments across all projects */}
                    <RecentMilestoneComments projectIds={myProjects.map(p => p.id)} />

                    {/* Quick Project Timeline */}
                    <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Clock size={16} />
                            Upcoming Deadlines
                        </h3>
                        <div className="space-y-3">
                            {activeProjectsSorted
                                .filter(p => p.endDate && !p.isOverdue)
                                .slice(0, 5)
                                .map(project => (
                                    <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{project.name}</span>
                                        <span className={`text-xs font-medium flex-shrink-0 ${project.daysRemaining <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {project.endDate && format(new Date(project.endDate), 'MMM d')}
                                        </span>
                                    </Link>
                                ))
                            }
                            {activeProjectsSorted.filter(p => p.endDate && !p.isOverdue).length === 0 && (
                                <p className="text-sm text-gray-400">No upcoming deadlines</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component to show recent milestone comments across all BO projects
const RecentMilestoneComments = ({ projectIds }: { projectIds: number[] }) => {
    // We fetch comments for the first project that has a valid ID
    // RTK Query doesn't support multi-key fetching in a single hook, so show for first project
    const firstProjectId = projectIds[0];
    const { data: comments = [] } = useGetMilestoneCommentsQuery(firstProjectId, {
        skip: !firstProjectId,
    });

    const recentComments = comments.slice(0, 5);

    return (
        <div className="bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare size={16} />
                Recent Comments
            </h3>
            {recentComments.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No milestone comments yet.</p>
            ) : (
                <div className="space-y-3">
                    {recentComments.map(comment => (
                        <div key={comment.id} className="border-l-2 border-blue-300 dark:border-blue-700 pl-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{comment.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{comment.user?.username}</span>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BusinessOwnerHome;
