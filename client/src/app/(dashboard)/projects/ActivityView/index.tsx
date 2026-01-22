"use client";

import React, { useState } from 'react';
import { useGetProjectActivitiesQuery, Activity } from '@/state/api';
import { formatDistanceToNow, format } from 'date-fns';
import { MessageSquare, Plus, CheckCircle, Minus, Edit, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Image from 'next/image';

type Props = {
    projectId: number;
    searchTerm?: string;
};

const ActivityIcon = ({ type }: { type: string }) => {
    switch(type) {
        case 'TASK_CREATED':
            return <div className="bg-blue-500 rounded-full p-2"><Plus size={12} className="text-white" /></div>;
        case 'TASK_STATUS_UPDATED':
            return <div className="bg-green-500 rounded-full p-2"><CheckCircle size={12} className="text-white" /></div>;
        case 'COMMENT_ADDED':
            return <div className="bg-yellow-500 rounded-full p-2"><MessageSquare size={12} className="text-white" /></div>;
        case 'TASK_DELETED':
            return <div className="bg-red-500 rounded-full p-2"><Minus size={12} className="text-white" /></div>;
        case 'TASK_UPDATED':
            return <div className="bg-purple-500 rounded-full p-2"><Edit size={12} className="text-white" /></div>;
        default:
            return null;
    }
}

const ActivityView = ({ projectId, searchTerm = '' }: Props) => {
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const limit = 15;
    
    const { data: qData, isLoading, isError } = useGetProjectActivitiesQuery({ 
        projectId, 
        page, 
        limit,
        search: searchTerm,
        startDate,
        endDate
    });

    const activities = (qData && 'data' in qData) ? qData.data : (Array.isArray(qData) ? qData : []);
    const meta = (qData && 'meta' in qData) ? qData.meta : null;

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
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        if (endDate && newStartDate > endDate) {
            setEndDate(newStartDate);
        }
        setPage(1);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value;
        setEndDate(newEndDate);
        if (startDate && newEndDate < startDate) {
            setStartDate(newEndDate);
        }
        setPage(1);
    };

    if (isLoading) return <div className="p-6 text-center">Loading activity...</div>;
    if (isError) return <div className="p-6 text-center text-red-500">Failed to load activity.</div>;

    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-dark-tertiary py-2 mb-3 gap-2">
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Project Activity
                    </h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 text-nowrap dark:text-gray-400">From:</label>
                        <input 
                            type="date" 
                            className="text-xs rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-tertiary dark:bg-dark-secondary dark:text-white"
                            value={startDate} 
                            max={endDate}
                            onChange={handleStartDateChange} 
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 text-nowrap dark:text-gray-400">To:</label>
                        <input 
                            type="date" 
                            className="text-xs rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-tertiary dark:bg-dark-secondary dark:text-white"
                            value={endDate} 
                            min={startDate}
                            onChange={handleEndDateChange} 
                        />
                    </div>
                    {meta && <div className="text-xs text-gray-500 ml-2">Total: {meta.totalActivities}</div>}
                </div>
            </div>

            {/* Activities List */}
            {activities.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm 
                            ? `No activities found for "${searchTerm}"`
                            : `No activities found`
                        }
                    </p>
                </div>
            ) : (
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {activities.map((activity: Activity, activityIdx: number) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {activityIdx !== activities.length - 1 ? (
                                        <span className="absolute left-6 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex items-start space-x-4">
                                        <div className="relative">
                                            {activity.user.profilePictureUrl ? (
                                                <Image
                                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${activity.user.profilePictureUrl}`}
                                                    alt={activity.user.username}
                                                    width={48}
                                                    height={48}
                                                    className="h-12 w-12 rounded-full object-cover ring-4 ring-white dark:ring-dark-bg"
                                                />
                                            ) : (
                                                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400 ring-4 ring-white dark:ring-dark-bg">
                                                    <span className="text-lg font-medium text-white">
                                                        {activity.user.username.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-0.5 py-0.5 dark:bg-dark-secondary">
                                                <ActivityIcon type={activity.type} />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-3">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                <span className="font-semibold text-gray-900 dark:text-white">{activity.user.username}</span> {activity.description}
                                            </p>
                                            {activity.task && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                    Task: {activity.task.title}
                                                </p>
                                            )}
                                            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                                <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                                <span className="font-medium">
                                                    {format(new Date(activity.createdAt), 'EEEE, MMM dd')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

             {/* Pagination Controls */}
             {meta && (
                <div className="flex justify-center items-center gap-4 mt-8">
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

export default ActivityView;