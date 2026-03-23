"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGetTaskByIdQuery, useUpdateCommentMutation, useDeleteCommentMutation, Comment } from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { getProfilePictureSrc } from "@/lib/profilePicture";
import {
  X, Paperclip, MessageSquare, User, Calendar, Hash, Flag, CircleDot, Tag, MoreVertical, Edit2, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import AttachmentViewer from "../AttachmentViewer";
import MentionHighlighter from "../MentionHighlighter";
import ModalConfirm from "../ModalConfirm";
import ReactDOM from "react-dom";

const CommentAvatar = ({ user }: { user?: { username?: string; profilePictureUrl?: string } }) => {
  const [imageError, setImageError] = useState(false);
  const hasProfilePicture = user?.profilePictureUrl && !imageError;

  if (hasProfilePicture) {
    return (
      <img
        src={getProfilePictureSrc(user.profilePictureUrl)!}
        alt={user.username || "User"}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold">
      {user?.username ? user.username.substring(0, 2).toUpperCase() : <User size={16} />}
    </div>
  );
};

type Props = {
  taskId: number;
  onClose: () => void;
};

const ModalViewTask = ({ taskId, onClose }: Props) => {
  const loggedInUser = useAppSelector(selectCurrentUser);
  const { data: task, isLoading, isError } = useGetTaskByIdQuery(taskId);
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditStart = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
    setActiveMenuId(null);
  };

  const handleEditSave = async (commentId: number) => {
    if (!editText.trim() || isUpdating) return;
    try {
      await updateComment({ id: commentId, text: editText.trim(), taskId }).unwrap();
      setEditingCommentId(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleDeleteClick = (commentId: number) => {
    setDeletingCommentId(commentId);
    setIsConfirmModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCommentId || isDeleting) return;
    try {
      await deleteComment({ commentId: deletingCommentId, taskId }).unwrap();
      setIsConfirmModalOpen(false);
      setDeletingCommentId(null);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const priorityColors: Record<string, string> = {
    Urgent: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    High: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
    Low: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    Backlog: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex h-full w-full items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-dark-secondary ring-1 ring-black/5 dark:ring-white/10 mb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-tertiary">
          <div className="flex-1 pr-4">
            {isLoading ? (
              <div className="h-6 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{task?.title}</h2>
            )}
            {task && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {task.priority && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[task.priority] ?? "bg-gray-100 text-gray-600"}`}>
                    <Flag size={10} /> {task.priority}
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  <span className="font-medium text-gray-600 dark:text-gray-300">{task.project?.name ?? "Project"}</span>
                  <span className="mx-1">/</span>
                  <span className="font-medium text-gray-600 dark:text-gray-300 truncate max-w-[200px] inline-block align-bottom">{task.title ?? "Task Name"}</span>
                  <span className="mx-1">/</span>
                  <span className="font-medium text-gray-600 dark:text-gray-300">{task.status}</span>
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 dark:text-gray-500">Loading task…</p>
          </div>
        )}

        {/* Error state */}
        {(isError || (!isLoading && !task)) && (
          <div className="flex items-center justify-center py-20">
            <p className="text-red-500">Error loading task details.</p>
          </div>
        )}

        {/* Task content */}
        {task && (
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
            {/* Left: main */}
            <div className="space-y-6 md:col-span-2">
              {/* Description */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  <MentionHighlighter text={task.description || "No description provided."} />
                </p>
              </div>

              {/* Attachments */}
              {(task.attachments?.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Paperclip size={14} /> Attachments
                  </h3>
                  <div className="space-y-2">
                    {task.attachments?.map(att => <AttachmentViewer key={att.id} attachment={att} readOnly={true} />)}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <MessageSquare size={14} />
                  Comments
                  {(task.comments?.length ?? 0) > 0 && (
                    <span className="ml-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gray-100 px-1 text-[10px] font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-400">
                      {task.comments?.length}
                    </span>
                  )}
                </h3>
                <div className="space-y-4">
                  {task.comments?.map(comment => {
                    const isOwn = comment.userId === loggedInUser?.userId;
                    const isAdmin = loggedInUser?.role === "ADMIN";
                    const isEditing = editingCommentId === comment.id;

                    return (
                      <div key={comment.id} className="flex items-start gap-3 group">
                        <CommentAvatar user={comment.user} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comment.user?.username}</span>
                              <span className="text-[11px] text-gray-400">
                                {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, p") : ""}
                                {comment.isEdited && <span className="ml-1 opacity-60">(edited)</span>}
                              </span>
                            </div>

                            {(isOwn || isAdmin) && !isEditing && (
                              <div className="relative">
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === comment.id ? null : comment.id)}
                                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {activeMenuId === comment.id && (
                                  <div ref={menuRef} className="absolute right-0 mt-1 w-28 rounded-xl bg-white shadow-lg border border-gray-200 dark:bg-dark-tertiary dark:border-dark-tertiary z-20 py-1">
                                    {isOwn && (
                                      <button onClick={() => handleEditStart(comment)} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary flex items-center gap-2">
                                        <Edit2 size={12} /> Edit
                                      </button>
                                    )}
                                    <button onClick={() => handleDeleteClick(comment.id)} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-1 space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full rounded-lg border border-blue-400 bg-white p-2 text-sm text-gray-800 dark:bg-dark-tertiary dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
                                <button onClick={() => handleEditSave(comment.id)} disabled={isUpdating || !editText.trim()} className="text-xs font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50">
                                  {isUpdating ? "Saving…" : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                              <MentionHighlighter text={comment.text} />
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(task.comments?.length ?? 0) === 0 && (
                    <p className="text-sm italic text-gray-400 dark:text-gray-500">No comments yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-dark-tertiary dark:bg-dark-bg space-y-3 md:col-span-1 h-fit">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Details</h3>
              {[
                { icon: User, label: "Author", value: task.author?.username },
                { icon: User, label: "Assignee", value: task.assignee?.username || "Unassigned" },
                { icon: CircleDot, label: "Status", value: task.status },
                { icon: Calendar, label: "Start Date", value: task.startDate ? format(new Date(task.startDate), "MMM dd, yyyy") : "N/A" },
                { icon: Calendar, label: "Due Date", value: task.dueDate ? format(new Date(task.dueDate), "MMM dd, yyyy") : "N/A" },
                { icon: Hash, label: "Story Points", value: task.points || "N/A" },
                { icon: Tag, label: "Tags", value: task.tags || "None" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5 text-sm">
                  <Icon size={14} className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
                  <div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{String(value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ModalConfirm
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          isLoading={isDeleting}
        />
      </div>
    </div>,
    document.body
  );
};

export default ModalViewTask;