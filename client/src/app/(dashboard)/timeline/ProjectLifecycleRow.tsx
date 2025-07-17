"use client";

import React from 'react';
import { Project, ProjectVersion } from '@/state/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type Props = {
    project: Project;
    versions: ProjectVersion[];
    showArchived: boolean; // New prop to control visibility
};

const ProjectLifecycleRow = ({ project, versions, showArchived }: Props) => {
    const router = useRouter();

    const handleProjectClick = () => {
        router.push(`/projects/${project.id}`);
    };

    return (
        <div className="mb-6 p-4 rounded-lg bg-white dark:bg-dark-secondary shadow-md transition-all hover:shadow-lg">
            {/* Project Header */}
            <div 
                className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-dark-tertiary cursor-pointer hover:opacity-80"
                onClick={handleProjectClick}
            >
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{project.name}</h3>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Current Version: {project.version}
                </span>
            </div>

            {/* Versions Flow */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {/* Archived Versions */}
                {showArchived && versions.map(version => (
                    <div key={version.id} className="flex-shrink-0 p-3 rounded-md bg-gray-100 dark:bg-dark-tertiary border border-gray-200 dark:border-stroke-dark" title={`Archived on ${format(new Date(version.archivedAt), "MMM d, yyyy")}`}>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">Version {version.version}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(version.startDate), "MMM d, yyyy")} - {format(new Date(version.endDate), "MMM d, yyyy")}
                        </p>
                    </div>
                ))}

                {/* Active Version Block */}
                {project.startDate && (
                    <div className="flex-shrink-0 p-3 rounded-md bg-blue-500/10 border border-blue-500/30">
                        <p className="font-semibold text-blue-700 dark:text-blue-300">Version {project.version} (Active)</p>
                         <p className="text-xs text-blue-600 dark:text-blue-400">
                            Started: {format(new Date(project.startDate), "MMM d, yyyy")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectLifecycleRow;