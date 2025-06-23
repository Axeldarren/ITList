import type { Task } from '@/state/api';
import { format } from 'date-fns';
import React from 'react';
import {
    Paperclip,
    MessageSquare,
    Flag,
    CircleDot,
    Calendar as CalendarIcon,
    User,
    Users,
    MoreVertical,
    GitBranch,
} from 'lucide-react';

type Props = {
    task: Task
}

const TaskCard = ({ task }: Props) => {
    const attachmentCount = task.attachments?.length || 0;
    const commentCount = task.comments?.length || 0;

    const getPriorityIcon = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return <Flag className="h-4 w-4 flex-shrink-0 text-red-500" />;
            case 'high':
                return <Flag className="h-4 w-4 flex-shrink-0 text-yellow-500" />;
            case 'medium':
                return <Flag className="h-4 w-4 flex-shrink-0 text-green-500" />;
            case 'low':
                return <Flag className="h-4 w-4 flex-shrink-0 text-gray-400" />;
            default:
                return <Flag className="h-4 w-4 flex-shrink-0 text-blue-400" />;
        }
    };
    
    return (
        // Using --color-dark-secondary for the card background
        <div className='flex flex-col rounded-lg bg-white p-4 shadow-md transition-shadow duration-200 hover:shadow-xl dark:bg-[#1d1f21]'>
            {/* Header */}
            <div className="mb-2 flex items-start justify-between">
                <h3 className='pr-2 text-lg font-bold text-gray-900 dark:text-gray-100'>{task.title}</h3>
                <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <MoreVertical size={20} />
                </button>
            </div>
            
            {/* Description */}
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-300'>
                {task.description || "No description provided."}
            </p>

            {/* Tags using --color-blue-primary */}
            {task.tags && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {task.tags.split(',').map(tag => (
                        <span key={tag} className="rounded-full bg-[#0275ff]/10 px-2.5 py-1 text-xs font-semibold text-[#68b1ff] border border-[#0275ff]/30">
                            {tag.trim()}
                        </span>
                    ))}
                </div>
            )}
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" title={`Status: ${task.status}`}>
                    <CircleDot className="h-4 w-4 flex-shrink-0" />
                    <span className='truncate'>{task.status}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" title={`Priority: ${task.priority}`}>
                    {getPriorityIcon(task.priority)}
                    <span className='truncate'>{task.priority}</span>
                </div>
                 {/* Version Display */}
                 <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" title={`Version: ${task.version}`}>
                    <GitBranch className="h-4 w-4 flex-shrink-0" />
                    <span className='truncate'>Version {task.version || 1}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" title="Start Date">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span className='truncate'>
                        {task.startDate ? format(new Date(task.startDate), "MMM d, yyyy") : "Not set"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" title="Due Date">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span className='truncate'>
                        {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "Not set"}
                    </span>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-grow"></div>

            {/* Divider using --color-stroke-dark */}
            <div className="my-4 border-t border-gray-200 dark:border-[#2d3135]"></div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center" title={`Author: ${task.author?.username || "Unknown"}`}>
                        {/* User icon placeholder using --color-dark-tertiary */}
                        <User className="mr-2 h-5 w-5 rounded-full bg-[#3b3d40] p-0.5 text-gray-300" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{task.author?.username || "N/A"}</span>
                    </div>
                    <div className="flex items-center" title={`Assignee: ${task.assignee?.username || "Unassigned"}`}>
                        {/* Users icon placeholder using --color-dark-tertiary */}
                        <Users className="mr-2 h-5 w-5 rounded-full bg-[#3b3d40] p-0.5 text-gray-300" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{task.assignee?.username || "N/A"}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    {attachmentCount > 0 && (
                        <div className="flex items-center gap-1.5" title={`${attachmentCount} attachments`}>
                            <Paperclip className='h-4 w-4' />
                            <span>{attachmentCount}</span>
                        </div>
                    )}
                     <div className="flex items-center gap-1.5" title={`${commentCount} comments`}>
                        <MessageSquare className='h-4 w-4' />
                        <span>{commentCount}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TaskCard;