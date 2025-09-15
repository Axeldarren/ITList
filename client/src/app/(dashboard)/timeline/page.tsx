"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// Component & State Imports
import Header from '@/components/Header';
import { useGetProjectsQuery, useGetAllProjectVersionsQuery, ProjectVersion } from '@/state/api';
import ProjectLifecycleRow from './ProjectLifecycleRow';
import ModalNewProject from '../projects/ModalNewProject';
import { useAppSelector } from '@/app/redux';

// UI & Icon Imports
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Plus, ToggleLeft, ToggleRight, LayoutGrid, Rows3 } from 'lucide-react';

type TaskTypeItems = "task" | "milestone" | "project";

const Timeline = () => {
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: allVersions = [], isLoading: versionsLoading } = useGetAllProjectVersionsQuery();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(true);
  const [view, setView] = useState<'roadmap' | 'gantt'>('roadmap');
  const loggedInUser = useAppSelector((state) => state.auth.user);
  
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const router = useRouter();

  const versionsByProject = useMemo(() => {
    if (!allVersions) return {};
    return allVersions.reduce((acc, version) => {
        (acc[version.projectId] = acc[version.projectId] || []).push(version);
        return acc;
    }, {} as Record<number, ProjectVersion[]>);
  }, [allVersions]);

  const ganttTasks = useMemo(() => {
    const tasks: Task[] = [];
    if (!projects) return [];

    projects.forEach(project => {
        // --- THIS IS THE FIX ---
        // Only add archived versions if the Gantt view is NOT active.
        // This ensures the Gantt chart only ever shows active projects.
        if (view === 'roadmap' && showArchived && versionsByProject[project.id]) {
            versionsByProject[project.id].forEach(version => {
                tasks.push({
                    start: new Date(version.startDate),
                    end: new Date(version.endDate),
                    name: `${project.name} - V${version.version}`,
                    id: `project-${project.id}`,
                    type: 'project' as TaskTypeItems,
                    progress: 100, isDisabled: true,
                    styles: {
                        backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                        backgroundSelectedColor: isDarkMode ? '#4B5563' : '#D1D5DB',
                        progressColor: isDarkMode ? '#6B7280' : '#9CA3AF',
                    }
                });
            });
        }
        
        if (project.startDate && project.endDate) {
            tasks.push({
                start: new Date(project.startDate),
                end: new Date(project.endDate),
                name: `${project.name} - V${project.version} (Active)`,
                id: `project-${project.id}`,
                type: 'project' as TaskTypeItems, progress: 50, isDisabled: false,
                styles: { backgroundColor: '#3b82f6', backgroundSelectedColor: '#2563eb', progressColor: '#93c5fd' }
            });
        }
    });
    // For Gantt view, filter out the disabled (archived) tasks if history is off
    const finalTasks = view === 'gantt' ? tasks.filter(t => !t.isDisabled) : tasks;

    return finalTasks.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [projects, versionsByProject, isDarkMode, showArchived, view]); // Added `view` to the dependency array


  const handleTaskClick = (task: Task) => {
    const id = task.id.split('-')[1];
    router.push(`/projects/${id}`);
  };

  const isLoading = projectsLoading || versionsLoading;

  return (
    <div className='max-w-full p-8'>
        <ModalNewProject isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
        <Header 
            name='Projects Lifecycle'
            buttonComponent={
                <div className="flex items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center rounded-full bg-gray-100 dark:bg-dark-tertiary p-1 dark:text-white">
                        <button onClick={() => setView('roadmap')} className={`p-1.5 rounded-full ${view === 'roadmap' ? 'bg-white dark:bg-dark-secondary shadow' : ''}`} title="Roadmap View"><Rows3 size={20} /></button>
                        <button onClick={() => setView('gantt')} className={`p-1.5 rounded-full ${view === 'gantt' ? 'bg-white dark:bg-dark-secondary shadow' : ''}`} title="Gantt View"><LayoutGrid size={20} /></button>
                    </div>

                    {view === 'roadmap' && (
                        <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-dark-tertiary dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
                            {showArchived ? <ToggleRight className="text-blue-primary" /> : <ToggleLeft />}
                            <span>History</span>
                        </button>
                    )}

                    {/* Add Project Button */}
                    {loggedInUser?.isAdmin && (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-full bg-blue-primary px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-600">
                            <Plus size={18} /> Add Project
                        </button>
                    )}
                </div>
            }
        />

        <div className="mt-6">
            {isLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading timelines...</p>
            ) : view === 'roadmap' ? (
                // --- Roadmap View ---
                projects.map(project => (
                    <ProjectLifecycleRow 
                        key={project.id}
                        project={project}
                        versions={versionsByProject[project.id] || []}
                        showArchived={showArchived}
                    />
                ))
            ) : (
                // --- Gantt Chart View ---
                <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
                    <div className='timeline'>
                        <Gantt
                            tasks={ganttTasks}
                            viewMode={ViewMode.Month}
                            onClick={handleTaskClick}
                            listCellWidth=""
                        />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

export default Timeline;