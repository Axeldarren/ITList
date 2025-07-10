import type { Task } from '@/state/api';
import { format } from 'date-fns';
import React, { useState } from 'react';
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
    Trash2,
    Edit,
    MessageSquareMore, // <-- Import Edit icon
} from 'lucide-react';
import { useDeleteTaskMutation } from '@/state/api';
import toast from 'react-hot-toast';
import ModalConfirm from '../ModalConfirm';
import ModalEditTask from '../ModalEditTask'; // <-- Import the modal

type Props = {
    task: Task;
    openMenuId: number | null;
    onMenuToggle: (taskId: number) => void;
}

const TaskCard = ({ task, openMenuId, onMenuToggle }: Props) => {
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false); // <-- State for the edit modal
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
    
    const attachmentCount = task.attachments?.length || 0;
    const commentCount = task.comments?.length || 0;

    // --- Handlers for opening and closing the modal ---
    const handleCardClick = () => {
        setEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditModalOpen(false);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        onMenuToggle(task.id); // Close the kebab menu
        setEditModalOpen(true); // Open the edit modal
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        onMenuToggle(task.id); // Close the kebab menu
        setConfirmModalOpen(true); // Open the confirmation modal
    };

    const handleConfirmDelete = () => {
        const promise = deleteTask(task.id).unwrap();
        toast.promise(promise, {
            loading: 'Deleting task...',
            success: 'Task deleted successfully!',
            error: 'Failed to delete task.'
        });
        setConfirmModalOpen(false);
    };

    const getPriorityIcon = (priority: string) => {
        // ... (no changes in this function)
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
        <>
            {/* --- Render Modals --- */}
            {isEditModalOpen && (
                <ModalEditTask taskId={task.id} onClose={handleCloseModal} />
            )}

            <ModalConfirm
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Task"
                message={`Are you sure you want to permanently delete the task: "${task.title}"?`}
                isLoading={isDeleting}
            />

            {/* --- Main Card --- */}
            <div 
                onClick={handleCardClick} // <-- Open modal on card click
                className='flex cursor-pointer flex-col rounded-lg bg-white p-4 shadow-md transition-shadow duration-200 hover:shadow-xl dark:bg-[#1d1f21]'
            >
                <div className="mb-2 flex items-start justify-between">
                    <h3 className='pr-2 text-lg font-bold text-gray-900 dark:text-gray-100'>{task.title}</h3>
                    <div className="relative flex-shrink-0">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); // <-- Stop propagation to prevent card click
                                onMenuToggle(task.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <MoreVertical size={20} />
                        </button>
                        {openMenuId === task.id && (
                            <div 
                                onClick={(e) => e.stopPropagation()} // <-- Stop propagation on menu container
                                className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-dark-tertiary"
                            >
                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                    {/* --- Edit Button --- */}
                                    <button
                                        onClick={handleEditClick}
                                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                                        role="menuitem"
                                    >
                                        <Edit className="mr-3 h-5 w-5" />
                                        <span>Edit</span>
                                    </button>
                                    {/* --- Delete Button --- */}
                                    <button
                                        onClick={handleDeleteClick}
                                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-500 dark:hover:bg-gray-600"
                                        role="menuitem"
                                    >
                                        <Trash2 className="mr-3 h-5 w-5" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <p className='mb-4 text-sm text-gray-600 dark:text-gray-300'>
                    {task.description ? (task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description) : "No description provided."}
                </p>

                {task.tags && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {task.tags.split(',').map(tag => (
                            <span key={tag} className="rounded-full bg-[#0275ff]/10 px-2.5 py-1 text-xs font-semibold text-[#68b1ff] border border-[#0275ff]/30">
                                {tag.trim()}
                            </span>
                        ))}
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" title={`Status: ${task.status}`}>
                        <CircleDot className="h-4 w-4 flex-shrink-0" />
                        <span className='truncate'>{task.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" title={`Priority: ${task.priority}`}>
                        {getPriorityIcon(task.priority || "")}
                        <span className='truncate'>{task.priority}</span>
                    </div>
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

                <div className="flex-grow"></div>

                <div className="my-4 border-t border-gray-200 dark:border-[#2d3135]"></div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center" title={`Author: ${task.author?.username || "Unknown"}`}>
                            <User className="mr-2 h-5 w-5 rounded-full bg-[#3b3d40] p-0.5 text-gray-300" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{task.author?.username || "N/A"}</span>
                        </div>
                        <div className="flex items-center" title={`Assignee: ${task.assignee?.username || "Unassigned"}`}>
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
                            <MessageSquareMore className='h-4 w-4' />
                            <span>{commentCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TaskCard;