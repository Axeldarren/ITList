"use client";

import React from 'react';
import { useGetProjectActivitiesQuery } from '@/state/api';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus, CheckCircle, Minus, Edit } from 'lucide-react';
import Image from 'next/image';

type Props = {
    projectId: number;
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

const ActivityView = ({ projectId }: Props) => {
    const { data: activities = [], isLoading, isError } = useGetProjectActivitiesQuery(projectId);

    if (isLoading) return <div className="p-6 text-center">Loading activity...</div>;
    if (isError) return <div className="p-6 text-center text-red-500">Failed to load activity.</div>;

    return (
        <div className="p-4 md:p-6">
            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {activities.map((activity, activityIdx) => (
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
                                        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ActivityView;