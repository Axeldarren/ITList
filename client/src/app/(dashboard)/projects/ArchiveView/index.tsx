"use client";

import React, { useState } from 'react';
import { Task, ProjectVersion, useGetProjectVersionHistoryQuery, useGetTasksQuery } from '@/state/api';
import TaskCard from '@/components/TaskCard';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
    projectId: number;
};

const VersionSection = ({ projectId, version }: { projectId: number, version: ProjectVersion }) => {
    const { data: tasksData, isLoading } = useGetTasksQuery({ 
        projectId, 
        version: version.version 
    });

    // Handle potential paginated response structure from getTasks (though we expect array here if we didn't pass page/limit, but for safety)
    const tasks: Task[] = (tasksData && 'data' in tasksData) ? tasksData.data : (Array.isArray(tasksData) ? tasksData : []);

    return (
        <div>
            <div className="border-b-2 border-blue-primary/30 pb-2 mb-4">
                <h2 className='text-2xl font-bold dark:text-white'>Version {version.version}</h2>
                <div className='flex gap-4'>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Archived on {format(new Date(version.archivedAt), "MMM d, yyyy")}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Duration: {format(new Date(version.startDate), "MMM d, yyyy")} - {format(new Date(version.endDate), "MMM d, yyyy")}
                    </p>
                </div>
            </div>
            {isLoading ? (
                <div className="text-gray-400 italic">Loading tasks...</div>
            ) : tasks.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} isProjectActive={false} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">No tasks were recorded for this version.</p>
            )}
        </div>
    );
};

const ArchiveView = ({ projectId }: Props) => {
    const [page, setPage] = useState(1);
    const limit = 5;

    const { data: historyData, isLoading, isError } = useGetProjectVersionHistoryQuery({ 
        projectId, 
        page, 
        limit 
    });

    const versionHistory = (historyData && 'data' in historyData) ? historyData.data : (Array.isArray(historyData) ? historyData : []);
    const meta = (historyData && 'meta' in historyData) ? historyData.meta : null;

    const handleNextPage = () => {
        if (meta && page < meta.totalPages) {
            setPage(page + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    if (isLoading) return <div className="p-6">Loading history...</div>;
    if (isError) return <div className="p-6 text-red-500">Failed to load history.</div>;

    return (
        <div className='px-4 py-6 xl:px-6 space-y-8'>
            {versionHistory.map(version => (
                <VersionSection key={version.id} projectId={projectId} version={version} />
            ))}
            
            {versionHistory.length === 0 && (
                <p className="text-gray-500 text-center">No version history available.</p>
            )}

             {/* Pagination Controls */}
             {meta && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <button
                       onClick={handlePreviousPage}
                       disabled={page === 1}
                       className="flex items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                   >
                       <ChevronLeft size={16} /> Previous
                   </button>
                   <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                       Page {page} of {meta.totalPages || 1}
                   </span>
                   <button
                       onClick={handleNextPage}
                       disabled={page >= (meta.totalPages || 1)}
                       className="flex items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                   >
                       Next <ChevronRight size={16} />
                   </button>
                </div>
             )}
        </div>
    );
};

export default ArchiveView;