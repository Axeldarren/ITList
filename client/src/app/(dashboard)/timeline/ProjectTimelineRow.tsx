"use client";

import React from 'react';
import { Project, ProjectVersion } from '@/state/api';
import { format, differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';

type Props = {
    project: Project;
    versions: ProjectVersion[];
    showArchived: boolean;
};

const ProjectTimelineRow = ({ project, versions, showArchived }: Props) => {
    const router = useRouter();

    const handleProjectClick = () => {
        router.push(`/projects/${project.id}`);
    };

    // Calculate total duration for scaling
    const allDates = [
        ...versions.map(v => new Date(v.startDate)),
        ...versions.map(v => new Date(v.endDate)),
    ];
    if (project.startDate) allDates.push(new Date(project.startDate));
    if (project.endDate) allDates.push(new Date(project.endDate));

    const minDate = new Date(Math.min.apply(null, allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max.apply(null, allDates.map(d => d.getTime())));
    const totalDuration = differenceInDays(maxDate, minDate) || 1;

    return (
        <div className="mb-4 p-4 rounded-lg bg-white dark:bg-dark-secondary shadow-sm">
            <div 
                className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-dark-tertiary cursor-pointer hover:opacity-80"
                onClick={handleProjectClick}
            >
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{project.name}</h3>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    V{project.version}
                </span>
            </div>

            <div className="relative h-8 bg-gray-100 dark:bg-dark-tertiary rounded-full">
                {showArchived && versions.map(version => {
                    const left = (differenceInDays(new Date(version.startDate), minDate) / totalDuration) * 100;
                    const width = (differenceInDays(new Date(version.endDate), new Date(version.startDate)) / totalDuration) * 100;
                    return (
                        <div
                            key={version.id}
                            className="absolute h-full rounded-full bg-gray-300 dark:bg-gray-600 tooltip"
                            style={{ left: `${left}%`, width: `${width}%` }}
                        >
                            <span className="tooltip-text">V{version.version}: {format(new Date(version.startDate), 'MMM d')} - {format(new Date(version.endDate), 'MMM d')}</span>
                        </div>
                    );
                })}
                {project.startDate && project.endDate && (
                    <div
                        className="absolute h-full rounded-full bg-blue-500 tooltip"
                        style={{ 
                            left: `${(differenceInDays(new Date(project.startDate), minDate) / totalDuration) * 100}%`, 
                            width: `${(differenceInDays(new Date(project.endDate), new Date(project.startDate)) / totalDuration) * 100}%`
                        }}
                    >
                         <span className="tooltip-text">V{project.version} (Active)</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectTimelineRow;