"use client";

import React from 'react';
import { Project, ProjectStatus, ProjectVersion } from '@/state/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type Props = {
    project: Project;
    versions: ProjectVersion[];
    showArchived: boolean;
};

// Helper to get the badge color based on status
const getStatusBadgeColor = (status: ProjectStatus | string | undefined) => {
    switch (status) {
        case 'OnProgress': return 'bg-blue-500';
        case 'Resolve': return 'bg-yellow-500';
        case 'Finish': return 'bg-green-500';
        case 'Cancel': return 'bg-red-500';
        case 'Start':
        default:
            return 'bg-gray-500';
    }
};

const ProjectLifecycleRow = ({ project, versions, showArchived }: Props) => {
    const router = useRouter();

    const handleProjectClick = () => {
        router.push(`/projects/${project.id}`);
    };
    
    const badgeColor = getStatusBadgeColor(project.status);

    const activeBlockStyles = project.status === 'Cancel' 
        ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' 
        : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300';

    return (
        <div className="mb-6 p-4 rounded-lg bg-white dark:bg-dark-secondary shadow">
            {/* Project Header */}
            <div 
                className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-dark-tertiary cursor-pointer hover:opacity-80"
                onClick={handleProjectClick}
            >
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{project.name}</h3>
                <div className="flex items-center gap-2">
                    {/* Status Badge still shows the correct status color */}
                    <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${badgeColor}`}>
                        {project.status}
                    </span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        V{project.version}
                    </span>
                </div>
            </div>

            {/* Versions Flow */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {showArchived && versions.map(version => {
                    const isCanceled = version.status === 'Cancel';
                    
                    const versionBlockStyle = isCanceled 
                        ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                        : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
                    
                    const versionTextStyle = isCanceled
                        ? '' // Already handled by the block style
                        : 'text-gray-800 dark:text-gray-400';
                    
                    const versionSubTextStyle = isCanceled
                        ? ''
                        : 'text-gray-600 dark:text-gray-500';
                    
                    return (
                        <div key={version.id} className={`flex-shrink-0 p-3 rounded-md border ${versionBlockStyle}`} title={`Archived on ${format(new Date(version.archivedAt), "MMM d, yyyy")}`}>
                            <p className={`font-semibold ${versionTextStyle}`}>Version {version.version} ({version.status})</p>
                            <p className={`text-xs ${versionSubTextStyle}`}>
                                {format(new Date(version.startDate), "MMM d, yyyy")} - {format(new Date(version.endDate), "MMM d, yyyy")}
                            </p>
                        </div>
                    );
                })}

                {/* Active Version Block */}
                {project.startDate && (
                    <div className={`flex-shrink-0 p-3 rounded-md border ${activeBlockStyles}`}>
                        <p className="font-semibold">Version {project.version} ({project.status})</p>
                         <p className="text-xs">
                            Started: {format(new Date(project.startDate), "MMM d, yyyy")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectLifecycleRow;