"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// Component & State Imports
import Header from '@/components/Header';
import { useGetTimelineProjectsQuery, TimelineProject } from '@/state/api';
import ProjectLifecycleRow from './ProjectLifecycleRow';
import ModalNewProject from '../projects/ModalNewProject';
import { useAppSelector } from '@/app/redux';

// UI & Icon Imports
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Plus, ChevronLeft, ChevronRight, GitBranch } from 'lucide-react';

type TaskTypeItems = "task" | "milestone" | "project";

const Timeline = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [view, setView] = useState<'roadmap' | 'gantt'>('roadmap');
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortOption, setSortOption] = useState('oldest');

    const { data: timelineData, isLoading, isFetching } = useGetTimelineProjectsQuery({
        page,
        limit,
        search: searchQuery,
        status: selectedStatus,
        sort: sortOption
    });

    const projects = useMemo(() => timelineData?.data || [], [timelineData]);
    const meta = useMemo(() => timelineData?.meta, [timelineData]);

    const loggedInUser = useAppSelector((state) => state.auth.user);
    const router = useRouter();

    const ganttTasks = useMemo(() => {
        const tasks: Task[] = [];
        if (!projects || projects.length === 0) return [];

        projects.forEach((project: TimelineProject) => {
            // Add current active project version
            if (project.startDate && project.endDate) {
                tasks.push({
                    start: new Date(project.startDate),
                    end: new Date(project.endDate),
                    name: `${project.name} - V${project.version} (Active)`,
                    id: `project-${project.id}-active`,
                    type: 'project' as TaskTypeItems, progress: 50, isDisabled: false,
                    styles: { backgroundColor: '#3b82f6', backgroundSelectedColor: '#2563eb', progressColor: '#93c5fd' }
                });
            }
        });
        
        return tasks;
    }, [projects]);

    const handleTaskClick = (task: Task) => {
        const idParts = task.id.split('-');
        const projectId = idParts[1];
        if (projectId) {
            router.push(`/projects/${projectId}`);
        }
    };



    return (
        <div className='max-w-full p-8'>
            <ModalNewProject isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        
            <Header 
                name='Projects Timeline'
                buttonComponent={
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Search Bar */}
                         <div className="relative">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-4 pr-10 py-2 rounded-full border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48 transition-shadow"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* Status Filter */}
                        <select 
                            className="px-4 py-2 rounded-full border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm transition-shadow"
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="Start">Start</option>
                            <option value="OnProgress">On Progress</option>
                            <option value="Resolve">Resolve</option>
                            <option value="Finish">Finish</option>
                            <option value="Cancel">Cancel</option>
                        </select>

                        {/* Sort Order */}
                        <select 
                            className="px-4 py-2 rounded-full border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm transition-shadow"
                            value={sortOption}
                            onChange={(e) => {
                                setSortOption(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="oldest">Earliest First</option>
                            <option value="newest">Latest First</option>
                            <option value="a-z">A-Z</option>
                            <option value="z-a">Z-A</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex items-center rounded-full bg-gray-100 dark:bg-dark-tertiary p-1 dark:text-white">
                            <button onClick={() => setView('roadmap')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${view === 'roadmap' ? 'bg-white dark:bg-dark-secondary shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Roadmap</button>
                            <button onClick={() => setView('gantt')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${view === 'gantt' ? 'bg-white dark:bg-dark-secondary shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Gantt</button>
                        </div>

                        {/* Add Project Button */}
                        {loggedInUser?.role === 'ADMIN' && (
                            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-full bg-blue-primary px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-600">
                                <Plus size={18} /> Add Project
                            </button>
                        )}
                    </div>
                }
            />

            <div className="mt-6">
                {(isLoading || isFetching) && projects.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-dark-tertiary flex items-center justify-center mb-4">
                            <GitBranch className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 font-semibold">No projects found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                   <div key={view} className="animate-in slide-in-from-right-5 fade-in duration-300">
                        {view === 'roadmap' ? (
                            // --- Roadmap View ---
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {projects.map((project: TimelineProject) => (
                                    <ProjectLifecycleRow 
                                        key={project.id}
                                        project={project}
                                        versions={project.versions || []}
                                    />
                                ))}
                            </div>
                        ) : (
                            // --- Gantt Chart View ---
                            <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
                                <div className='timeline'>
                                    <Gantt
                                        tasks={ganttTasks}
                                        viewMode={ViewMode.Month}
                                        onClick={handleTaskClick}
                                        listCellWidth=""
                                        barFill={50}
                                    />
                                </div>
                            </div>
                        )}
                   </div>
                )}
            </div>

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 gap-1.5">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading || isFetching}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-dark-secondary dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={15} />
                    </button>

                    {(() => {
                        const total = meta.totalPages;
                        const windowSize = 5;
                        let start = Math.max(1, page - Math.floor(windowSize / 2));
                        const end = Math.min(total, start + windowSize - 1);
                        if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
                        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                disabled={isLoading || isFetching}
                                className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                    p === page
                                        ? 'bg-blue-primary text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                {p}
                            </button>
                        ));
                    })()}

                    <button
                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages || isLoading || isFetching}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-dark-secondary dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default Timeline;