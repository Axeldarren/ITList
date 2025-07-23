"use client";

import React from "react";
import { useGetTaskByIdQuery } from "@/state/api";
import {
  X, Paperclip, MessageSquare, User, Calendar, Hash, Flag, CircleDot, Tag,
} from "lucide-react";
import { format } from "date-fns";
import AttachmentViewer from "../AttachmentViewer"; // We'll reuse this component

type Props = {
  taskId: number;
  onClose: () => void;
};

const ModalViewTask = ({ taskId, onClose }: Props) => {
  const { data: task, isLoading, isError } = useGetTaskByIdQuery(taskId);

  if (isLoading) return ( <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Task...</div> );
  if (isError || !task) return ( <div className="p-6 text-center text-red-500">Error loading task details.</div> );

  const detailItemStyle = "flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300";
  const detailIconStyle = "h-5 w-5 text-gray-500 dark:text-gray-400";

  return (
    <div
      className="bg-opacity-70 fixed inset-0 z-50 flex h-full w-full items-start justify-center overflow-y-auto bg-black p-4 pt-12"
      onClick={onClose}
    >
      <div
        className="dark:bg-dark-secondary relative w-full max-w-4xl rounded-lg bg-gray-100 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Task Title (Read-Only) */}
        <h2 className="w-2/3 text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          in list <span className="font-semibold">{task.status}</span>
        </p>
        
        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
                {/* Description */}
                <div>
                    <h3 className="text-lg font-semibold dark:text-white">Description</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {task.description || "No description provided."}
                    </p>
                </div>
                {/* Attachments */}
                <div>
                    <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                        <Paperclip size={18} /> Attachments
                    </h3>
                    <div className="mt-2 space-y-2">
                        {task.attachments?.map(att => <AttachmentViewer key={att.id} attachment={att} readOnly={true} />)}
                        {task.attachments?.length === 0 && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No attachments.</p>}
                    </div>
                </div>
                {/* Comments */}
                <div>
                     <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                        <MessageSquare size={18} /> Comments
                    </h3>
                    <div className="mt-4 space-y-4">
                        {task.comments?.map(comment => (
                            <div key={comment.id} className="flex items-start space-x-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white text-xs font-bold">
                                    {comment.user?.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold dark:text-white">{comment.user?.username}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                        {task.comments?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>}
                    </div>
                </div>
            </div>

            {/* Right side: Details */}
            <div className="space-y-4 md:col-span-1">
                <h3 className="text-lg font-semibold dark:text-white">Details</h3>
                <div className={detailItemStyle}><User className={detailIconStyle} /><span>Author: {task.author?.username}</span></div>
                <div className={detailItemStyle}><User className={detailIconStyle} /><span>Assignee: {task.assignee?.username || 'Unassigned'}</span></div>
                <div className={detailItemStyle}><Flag className={detailIconStyle} /><span>Priority: {task.priority}</span></div>
                <div className={detailItemStyle}><CircleDot className={detailIconStyle} /><span>Status: {task.status}</span></div>
                <div className={detailItemStyle}><Calendar className={detailIconStyle} /><span>Start Date: {task.startDate ? format(new Date(task.startDate), 'MMM dd, yyyy') : 'N/A'}</span></div>
                <div className={detailItemStyle}><Calendar className={detailIconStyle} /><span>Due Date: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'N/A'}</span></div>
                <div className={detailItemStyle}><Hash className={detailIconStyle} /><span>Story Points: {task.points || 'N/A'}</span></div>
                <div className={detailItemStyle}><Tag className={detailIconStyle} /><span>Tags: {task.tags || 'None'}</span></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModalViewTask;