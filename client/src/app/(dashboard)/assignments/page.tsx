"use client";

import React, { useMemo, useState } from 'react';
import { useGetUsersQuery, useGetAllTasksQuery, useGetProjectsQuery, User, Task } from '@/state/api';
import Header from '@/components/Header';
import { AlertTriangle, CheckCircle, Target, Calendar, ArrowRight, User as UserIcon, ExternalLink } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ModalViewAllTasks from '@/components/ModalViewAllTasks';

interface DeveloperAssignment extends User {
    totalTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    underReviewTasks: number;
    tasks: Task[];
    overdue: Task[];
}

const Assignments = () => {
    const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperAssignment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();
    
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
    const { data: tasks = [], isLoading: tasksLoading } = useGetAllTasksQuery();
    const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();

    // Filter out deleted users and only show developers (non-admin users)
    const developers = useMemo(() => {
        return users.filter(user => !user.deletedAt && !user.isAdmin);
    }, [users]);

    // Create project lookup map
    const projectMap = useMemo(() => {
        return new Map(projects.map(p => [p.id, p]));
    }, [projects]);

    // Process assignments for each developer
    const developerAssignments = useMemo(() => {
        return developers.map(developer => {
            const assignedTasks = tasks.filter(task => 
                task.assignedUserId === developer.userId && 
                task.status !== 'Completed' && 
                task.status !== 'Archived' &&
                !task.project?.deletedAt // Exclude tasks from deleted projects
            ).sort((a, b) => {
                // Sort by due date (earliest first), with tasks without due dates at the end
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });

            const overdueTasks = assignedTasks.filter(task => {
                if (!task.id || !task.dueDate || task.status === 'Under Review' || task.status === 'Completed') return false;
                if (new Date(task.dueDate).getTime() <= 0) return false; // Ensure valid date
                return isAfter(new Date(), new Date(task.dueDate));
            });

            const inProgressTasks = assignedTasks.filter(task => task.status === 'Work In Progress');
            const todoTasks = assignedTasks.filter(task => task.status === 'To Do');
            const underReviewTasks = assignedTasks.filter(task => task.status === 'Under Review');

            return {
                ...developer,
                totalTasks: assignedTasks.length,
                overdueTasks: overdueTasks.length,
                inProgressTasks: inProgressTasks.length,
                todoTasks: todoTasks.length,
                underReviewTasks: underReviewTasks.length,
                tasks: assignedTasks,
                overdue: overdueTasks
            };
        }).sort((a, b) => {
            // Sort developers: those with tasks first, then by total task count (descending), then by name
            if (a.totalTasks > 0 && b.totalTasks === 0) return -1;
            if (a.totalTasks === 0 && b.totalTasks > 0) return 1;
            if (a.totalTasks !== b.totalTasks) return b.totalTasks - a.totalTasks; // More tasks first
            return (a.username || '').localeCompare(b.username || ''); // Alphabetical by name
        });
    }, [developers, tasks]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'To Do': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            case 'Work In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Under Review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgent': return 'text-red-600';
            case 'High': return 'text-orange-600';
            case 'Medium': return 'text-yellow-600';
            case 'Low': return 'text-green-600';
            case 'Backlog': return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    const handleViewAllTasks = (dev: DeveloperAssignment) => {
        if (dev.userId) {
            setSelectedDeveloper(dev);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDeveloper(null);
    };

    const handleTaskClick = (task: Task) => {
        if (task.projectId) {
            router.push(`/projects/${task.projectId}`);
        }
    };

    if (usersLoading || tasksLoading || projectsLoading) {
        return (
            <div className="p-6">
                <Header name="Developer Assignments" />
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Loading assignments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Header name="Developer Assignments" />
            <p className="text-gray-500 dark:text-gray-400 mb-6">
                Overview of current developer workloads and task assignments
            </p>

            {/* Modal for viewing all tasks */}
            {selectedDeveloper && selectedDeveloper.userId && (
                <ModalViewAllTasks
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    developer={{
                        userId: selectedDeveloper.userId,
                        username: selectedDeveloper.username || '',
                        email: selectedDeveloper.email || '',
                        profilePictureUrl: selectedDeveloper.profilePictureUrl
                    }}
                    tasks={selectedDeveloper.tasks || []}
                    projects={projectMap}
                />
            )}

            {developerAssignments.length === 0 ? (
                <div className="text-center py-12">
                    <UserIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No developers found
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {developerAssignments.map((dev) => (
                        <div key={dev.userId} className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            {/* Developer Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-3 mb-3">
                                    {dev.profilePictureUrl ? (
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${dev.profilePictureUrl}`}
                                            alt={dev.username || 'Developer'}
                                            width={48}
                                            height={48}
                                            className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg">
                                            {dev.username?.substring(0, 2).toUpperCase() || <UserIcon size={24} className="text-gray-600 dark:text-gray-300" />}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {dev.username}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {dev.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Overview */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-2 bg-gray-50 dark:bg-dark-tertiary rounded">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Target size={14} className="text-blue-500" />
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</span>
                                        </div>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {dev.totalTasks}
                                        </span>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-dark-tertiary rounded">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <AlertTriangle size={14} className="text-red-500" />
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Overdue</span>
                                        </div>
                                        <span className={`text-lg font-bold ${dev.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                            {dev.overdueTasks}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Task Breakdown */}
                            <div className="p-4">
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">To Do</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{dev.todoTasks}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                                        <span className="text-sm font-semibold text-blue-600">{dev.inProgressTasks}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Under Review</span>
                                        <span className="text-sm font-semibold text-yellow-600">{dev.underReviewTasks}</span>
                                    </div>
                                </div>

                                {/* Recent/Priority Tasks */}
                                {dev.tasks.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Current Tasks ({Math.min(3, dev.tasks.length)})
                                        </h4>
                                        {dev.tasks.slice(0, 3).map((task) => {
                                            const project = projectMap.get(task.projectId);
                                            const isOverdue = task.id && // Ensure task has an ID (not a new task)
                                                            task.dueDate && 
                                                            task.status !== 'Under Review' && 
                                                            task.status !== 'Completed' &&
                                                            new Date(task.dueDate).getTime() > 0 && // Ensure valid date
                                                            isAfter(new Date(), new Date(task.dueDate));
                                            
                                            return (
                                                <div 
                                                    key={task.id} 
                                                    onClick={() => handleTaskClick(task)}
                                                    className={`p-2 bg-gray-50 dark:bg-dark-tertiary rounded border relative cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-tertiary/80 transition-colors ${isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' : ''}`}
                                                >
                                                    {/* Overdue stamp */}
                                                    {isOverdue && (
                                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full transform rotate-12 shadow-md z-[1]">
                                                            OVERDUE
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-start justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                                                            {task.title}
                                                        </span>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            {task.priority && (
                                                                <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                                                    {task.priority}
                                                                </span>
                                                            )}
                                                            <ExternalLink size={12} className="text-gray-400 opacity-70" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status || '')}`}>
                                                                {task.status}
                                                            </span>
                                                            {project && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                    {project.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {task.dueDate && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                                                                <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                                                    {format(new Date(task.dueDate), 'MMM dd')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {dev.tasks.length > 3 && (
                                            <button 
                                                onClick={() => handleViewAllTasks(dev)}
                                                className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center justify-center gap-1"
                                            >
                                                View all {dev.tasks.length} tasks
                                                <ArrowRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {dev.tasks.length === 0 && (
                                    <div className="text-center py-4">
                                        <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            No active tasks
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Workload Indicator */}
                            <div className="px-4 pb-4">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    <span>Workload</span>
                                    <span>{dev.totalTasks} tasks</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            dev.totalTasks > 8 ? 'bg-red-500' : 
                                            dev.totalTasks > 5 ? 'bg-yellow-500' : 
                                            'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(100, (dev.totalTasks / 10) * 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>Light</span>
                                    <span>Heavy</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Assignments;
