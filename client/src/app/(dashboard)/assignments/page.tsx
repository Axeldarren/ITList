"use client";

import React, { useMemo, useState } from 'react';
import { useGetDeveloperAssignmentsQuery, useGetProjectsQuery, User, Task, DeveloperAssignmentWithStats } from '@/state/api';
import Header from '@/components/Header';
import { AlertTriangle, CheckCircle, Target, Calendar, ArrowRight, User as UserIcon, ExternalLink, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ModalViewAllTasks from '@/components/ModalViewAllTasks';

const Assignments = () => {
    const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperAssignmentWithStats | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('all');
    const [sortOption, setSortOption] = useState('username_asc');
    const [limit] = useState(8);

    const router = useRouter();
    
    // Fetch paginated assignments from backend
    const { 
        data: assignmentsData, 
        isLoading: assignmentsLoading, 
        isFetching: assignmentsFetching 
    } = useGetDeveloperAssignmentsQuery({
        page,
        limit,
        search: searchQuery,
        filter: filterOption,
        sort: sortOption
    });

    const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();

    const developers = assignmentsData?.data || [];
    const meta = assignmentsData?.meta;

    // Create project lookup map
    const projectMap = useMemo(() => {
        return new Map(projects.map(p => [p.id, p]));
    }, [projects]);

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

    const handleViewAllTasks = (dev: DeveloperAssignmentWithStats) => {
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to first page on search
    };

    if (assignmentsLoading || projectsLoading) {
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
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <p className="text-gray-500 dark:text-gray-400">
                    Overview of current developer workloads and task assignments
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Filter Dropdown */}
                    <select
                        className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm transition-shadow"
                        value={filterOption}
                        onChange={(e) => {
                            setFilterOption(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">Show All</option>
                        <option value="overdue">Has Overdue Tasks</option>
                    </select>

                    {/* Sort Dropdown */}
                    <select
                        className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm transition-shadow"
                        value={sortOption}
                        onChange={(e) => {
                            setSortOption(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="username_asc">Name (A-Z)</option>
                        <option value="username_desc">Name (Z-A)</option>
                        <option value="workload_high">Workload (High-Low)</option>
                        <option value="workload_low">Workload (Low-High)</option>
                    </select>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search developers..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg border-gray-300 dark:border-dark-tertiary dark:bg-dark-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
            </div>

            {/* Modal for viewing all tasks */}
            {selectedDeveloper && selectedDeveloper.userId && (
                <ModalViewAllTasks
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    developer={{
                        userId: selectedDeveloper.userId,
                        username: selectedDeveloper.username || '',
                        email: selectedDeveloper.email || '',
                        profilePictureUrl: selectedDeveloper.profilePictureUrl,
                        isAdmin: selectedDeveloper.isAdmin
                    }}
                    // tasks prop removed, handled inside ModalViewAllTasks
                    projects={projectMap}
                />
            )}

            {developers.length === 0 ? (
                <div className="text-center py-12">
                    <UserIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No developers found
                    </p>
                </div>
            ) : (
                <>
                   {assignmentsFetching && (
                        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                             Updating...
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {developers.map((dev: DeveloperAssignmentWithStats) => (
                            <div key={dev.userId} className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col h-full">
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
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                    {dev.username}
                                                </h3>
                                                {dev.isAdmin && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
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
                                <div className="p-4 flex-1 flex flex-col">
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
                                    {dev.tasks && dev.tasks.length > 0 && (
                                        <div className="space-y-2 mb-4 flex-1">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Top Priority
                                            </h4>
                                            {dev.tasks.slice(0, 3).map((task: Task) => {
                                                const project = projectMap.get(task.projectId);
                                                const isOverdue = task.id && // Ensure task has an ID
                                                                task.dueDate && 
                                                                task.status !== 'Under Review' && 
                                                                task.status !== 'Completed' &&
                                                                new Date(task.dueDate).getTime() > 0 && 
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
                                                                !
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex items-start justify-between mb-1">
                                                            <span className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">
                                                                {task.title}
                                                            </span>
                                                            {task.priority && (
                                                                <span className={`text-[10px] ml-1 ${getPriorityColor(task.priority)}`}>
                                                                    {task.priority}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(task.status || '')}`}>
                                                                {task.status}
                                                            </span>
                                                            
                                                            {task.dueDate && (
                                                                <span className={`text-[10px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                                                    {format(new Date(task.dueDate), 'MMM dd')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    <div className="mt-auto pt-2">
                                         <button 
                                            onClick={() => handleViewAllTasks(dev)}
                                            className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center justify-center gap-1 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                        >
                                            View all {dev.totalTasks} tasks
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Workload Indicator */}
                                <div className="px-4 pb-4">
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
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {meta && (
                         <div className="flex justify-center items-center mt-8 gap-4">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-secondary"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {page} of {meta.totalPages}
                            </span>

                            <button
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
                                className="flex items-center gap-1 px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-secondary"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Assignments;
