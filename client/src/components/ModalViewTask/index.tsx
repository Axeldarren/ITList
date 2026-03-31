"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGetTaskByIdQuery, useUpdateCommentMutation, useDeleteCommentMutation, Comment } from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { getProfilePictureSrc } from "@/lib/profilePicture";
import {
  X, Paperclip, MessageSquare, User, Calendar, Hash, Flag, CircleDot, Tag,
  MoreVertical, Edit2, Trash2, AlertCircle, Clock,
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
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-dark-secondary"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white text-xs font-bold ring-2 ring-white dark:ring-dark-secondary">
      {user?.username ? user.username.substring(0, 2).toUpperCase() : <User size={14} />}
    </div>
  );
};

const statusConfig: Record<string, { label: string; className: string }> = {
  "To Do":           { label: "To Do",            className: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400" },
  "Work In Progress":{ label: "In Progress",       className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  "Under Review":    { label: "Under Review",      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400" },
  "Completed":       { label: "Completed",         className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" },
};

const priorityConfig: Record<string, { className: string }> = {
  Urgent:  { className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  High:    { className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" },
  Medium:  { className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400" },
  Low:     { className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" },
  Backlog: { className: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400" },
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

  const isOverdue = !!task?.dueDate &&
    new Date(task.dueDate) < new Date(new Date().toDateString()) &&
    task.status !== "Completed";

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex h-full w-full items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-[2px] p-4 pt-10"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-dark-secondary ring-1 ring-black/5 dark:ring-white/10 mb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-gray-100 dark:border-dark-tertiary px-6 py-4">
          <div className="flex-1 pr-4 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
            ) : (
              <>
                {/* Breadcrumb */}
                <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <span className="font-medium text-gray-600 dark:text-gray-300">{task?.project?.name ?? "Project"}</span>
                  <span>/</span>
                  <span className="truncate max-w-[240px] font-medium text-gray-600 dark:text-gray-300">{task?.title ?? "Task"}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{task?.title}</h2>
                {/* Badges row */}
                {task && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {task.priority && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityConfig[task.priority]?.className ?? "bg-gray-100 text-gray-600"}`}>
                        <Flag size={10} /> {task.priority}
                      </span>
                    )}
                    {task.status && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig[task.status]?.className ?? "bg-gray-100 text-gray-600"}`}>
                        <CircleDot size={10} /> {statusConfig[task.status]?.label ?? task.status}
                      </span>
                    )}
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                        <AlertCircle size={10} /> OVERDUE
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Overdue Banner ── */}
        {!isLoading && isOverdue && (
          <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 ring-1 ring-red-200 dark:ring-red-500/20">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">
              <span className="font-semibold">Overdue</span>
              {task?.dueDate && ` · Was due ${format(new Date(task.dueDate), "MMM dd, yyyy")}`}
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        )}

        {/* Error state */}
        {(isError || (!isLoading && !task)) && (
          <div className="flex items-center justify-center py-20">
            <p className="text-red-500">Error loading task details.</p>
          </div>
        )}

        {/* ── Task Content ── */}
        {task && (
          <div className="grid grid-cols-1 gap-0 md:grid-cols-3">

            {/* Left: Description, Attachments, Comments */}
            <div className="space-y-6 p-6 md:col-span-2 md:border-r border-gray-100 dark:border-dark-tertiary">

              {/* Description */}
              <div>
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Description</h3>
                <div className="rounded-xl bg-gray-50 dark:bg-dark-bg p-4 ring-1 ring-gray-100 dark:ring-white/5">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    <MentionHighlighter text={task.description || "No description provided."} />
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {(task.attachments?.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                    <Paperclip size={11} /> Attachments
                    <span className="ml-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 px-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                      {task.attachments?.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {task.attachments?.map(att => (
                      <AttachmentViewer key={att.id} attachment={att} readOnly={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <MessageSquare size={11} /> Comments
                  {(task.comments?.length ?? 0) > 0 && (
                    <span className="ml-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
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
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comment.user?.username}</span>
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">
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
                            <div className="space-y-2">
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
                            <div className="rounded-xl rounded-tl-none bg-gray-50 dark:bg-dark-bg px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed ring-1 ring-gray-100 dark:ring-white/5">
                              <MentionHighlighter text={comment.text} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(task.comments?.length ?? 0) === 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-dark-bg px-4 py-3 text-sm text-gray-400 dark:text-gray-500 ring-1 ring-gray-100 dark:ring-white/5">
                      <MessageSquare size={14} />
                      No comments yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Details Panel */}
            <div className="p-5 md:col-span-1">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Details</h3>

              <div className="space-y-4">
                {/* Author */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Author</label>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-dark-bg px-3 py-2 ring-1 ring-gray-100 dark:ring-white/5">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                      {task.author?.username ? task.author.username.substring(0, 2).toUpperCase() : <User size={12} />}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{task.author?.username || "Unknown"}</span>
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Assignee</label>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-dark-bg px-3 py-2 ring-1 ring-gray-100 dark:ring-white/5">
                    {task.assignee ? (
                      <>
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                          {task.assignee.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{task.assignee.username}</span>
                      </>
                    ) : (
                      <>
                        <User size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Dates</label>
                  <div className="rounded-lg bg-gray-50 dark:bg-dark-bg ring-1 ring-gray-100 dark:ring-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-dark-tertiary">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <Calendar size={11} /> Start
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {task.startDate ? format(new Date(task.startDate), "MMM dd, yyyy") : "—"}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between px-3 py-2 ${isOverdue ? "bg-red-50 dark:bg-red-500/10" : ""}`}>
                      <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
                        {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />} Due
                      </div>
                      <span className={`text-xs font-medium ${isOverdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-700 dark:text-gray-300"}`}>
                        {task.dueDate ? format(new Date(task.dueDate), "MMM dd, yyyy") : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Story Points */}
                {task.points && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Story Points</label>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-dark-bg px-3 py-2 ring-1 ring-gray-100 dark:ring-white/5">
                      <Hash size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{task.points}</span>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {task.tags && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.split(",").map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-accent-100 dark:bg-accent-500/10 px-2.5 py-0.5 text-xs font-medium text-accent-600 dark:text-accent-400">
                          <Tag size={9} /> {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time logged (if any) */}
                {(task.timeLogs?.length ?? 0) > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Time Logged</label>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-dark-bg px-3 py-2 ring-1 ring-gray-100 dark:ring-white/5">
                      <Clock size={13} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {task.timeLogs?.length} session{task.timeLogs!.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
