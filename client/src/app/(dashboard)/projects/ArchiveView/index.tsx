"use client";

import React from 'react';
import { Task, ProjectVersion } from '@/state/api';
import TaskCard from '@/components/TaskCard';
import { format } from 'date-fns';

type Props = {
    versionHistory: ProjectVersion[];
    tasks: Task[]; // All tasks for the project
};

const ArchiveView = ({ versionHistory, tasks }: Props) => {
    return (
        <div className='px-4 py-6 xl:px-6 space-y-8'>
            {versionHistory.map(version => {
                const versionTasks = tasks.filter(task => task.version === version.version);
                return (
                    <div key={version.id}>
                        <div className="border-b-2 border-blue-primary/30 pb-2 mb-4">
                            <h2 className='text-2xl font-bold dark:text-white'>Version {version.version}</h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                Archived on {format(new Date(version.archivedAt), "MMM d, yyyy")}
                            </p>
                             <p className='text-sm text-gray-500 dark:text-gray-400'>
                                Duration: {format(new Date(version.startDate), "MMM d, yyyy")} - {format(new Date(version.endDate), "MMM d, yyyy")}
                            </p>
                        </div>
                        {versionTasks.length > 0 ? (
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                                {versionTasks.map(task => (
                                    <TaskCard key={task.id} task={task} isProjectActive={false} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No tasks were recorded for this version.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ArchiveView;