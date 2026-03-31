import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useAddAttachmentMutation,
  useGetProjectUsersQuery,
  useDeleteAttachmentMutation,
  useGetTaskCommentsQuery,
  useCreateStandaloneCommentMutation,
  Task as TaskType,
  Comment as CommentType,
  Priority,
  Status,
  useStartTimerMutation,
  useStopTimerMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from "@/state/api";
import {
  X,
  Paperclip,
  MessageSquare,
  User,
  Send,
  Clock,
  Trash2,
  Flag,
  Calendar,
  Square,
  Play,
  Reply,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { differenceInSeconds, format, formatDistanceToNow } from "date-fns";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { getProfilePictureSrc } from "@/lib/profilePicture";
import MentionInput from "@/components/MentionInput";
import MentionHighlighter from "@/components/MentionHighlighter";
import ModalConfirm from "@/components/ModalConfirm";
import ReactDOM from "react-dom";

const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "00:00:00";
    return new Date(seconds * 1000).toISOString().substring(11, 19);
};

const formatLogDuration = (startTime: string, endTime?: string | null): string => {
    if (!endTime) return "In progress...";
    const seconds = differenceInSeconds(new Date(endTime), new Date(startTime));
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    return `${m}m`;
};

// Comment Avatar Component
const CommentAvatar = ({ user }: { user?: { username?: string; profilePictureUrl?: string } }) => {
  const [imageError] = useState(false);
  const hasProfilePicture = user?.profilePictureUrl && !imageError;

  if (hasProfilePicture) {
    return (
      <img
        src={getProfilePictureSrc(user.profilePictureUrl)!}
        alt={user.username || "User"}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 text-white">
      <User size={18} />
    </div>
  );
};

type Props = {
  taskId: number;
  onClose: () => void;
  initialTab?: "discussion" | "worklog";
};

const ModalEditTask = ({ taskId, onClose, initialTab = "worklog" }: Props) => {
  // Get the current logged-in user from the Redux store
  const loggedInUser = useAppSelector(selectCurrentUser);
  const isAdmin = loggedInUser?.role === 'ADMIN';
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const [sidebarWidth, setSidebarWidth] = useState(isSidebarCollapsed ? 60 : 256);

  // Measure the actual sidebar width so the modal abuts it precisely (no sub-pixel gap)
  useLayoutEffect(() => {
    const measure = () => {
      const sidebar = document.querySelector('[class*="fixed"][class*="flex-col"][class*="h-full"]') as HTMLElement | null;
      if (sidebar) {
        setSidebarWidth(sidebar.getBoundingClientRect().width);
      } else {
        setSidebarWidth(isSidebarCollapsed ? 60 : 256);
      }
    };
    measure();
    // Re-measure during the sidebar transition
    const interval = setInterval(measure, 16);
    const timeout = setTimeout(() => clearInterval(interval), 350);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [isSidebarCollapsed]);

  // Queries and Mutations
  const { data: task, isLoading, isError } = useGetTaskByIdQuery(taskId);
  const { data: discussionComments = [] } = useGetTaskCommentsQuery(taskId);
  const [createStandaloneComment] = useCreateStandaloneCommentMutation();
  const [startTimer, { isLoading: isStarting }] = useStartTimerMutation();
  const [stopTimer, { isLoading: isStopping }] = useStopTimerMutation();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  const { data: users, isLoading: usersLoading } = useGetProjectUsersQuery(
    task?.projectId ?? 0,
    { skip: !task || !task.projectId },
  );
  const [updateTask] = useUpdateTaskMutation();
  const [addAttachment] = useAddAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateCommentMutation();

  const [isMounted, setIsMounted] = useState(false);

  // Component State
  const [formData, setFormData] = useState<Partial<TaskType>>({});
  const [newComment, setNewComment] = useState("");
  const [discussionInput, setDiscussionInput] = useState("");
  const [activeTab, setActiveTab] = useState<"discussion" | "worklog">(initialTab);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  const runningLog = task?.timeLogs?.find(log => log.userId === loggedInUser?.userId && !log.endTime);

  // Work log entries (comments linked to timeLogs)
  const workLogEntries = task?.timeLogs?.filter(log => log.endTime).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  ) || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        startDate: task.startDate
          ? format(new Date(task.startDate), "yyyy-MM-dd")
          : "",
        dueDate: task.dueDate
          ? format(new Date(task.dueDate), "yyyy-MM-dd")
          : "",
      });
    }
  }, [task]);

 useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (runningLog) {
      interval = setInterval(() => {
        const seconds = differenceInSeconds(new Date(), new Date(runningLog.startTime));
        setElapsedTime(formatDuration(seconds));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningLog]);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    updateTask({ id: taskId, ...formData })
      .unwrap()
      .then(() => toast.success(`Task "${formData.title || "Untitled"}" updated successfully!`))
      .catch(() => toast.error(`Failed to update task "${formData.title || "Untitled"}".`))
      .finally(() => onClose());
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !loggedInUser) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", String(taskId));
    formData.append("uploadedById", String(loggedInUser.userId));

    const promise = addAttachment(formData).unwrap();
    toast.promise(promise, {
      loading: `Uploading ${file.name}...`,
      success: "Attachment added successfully!",
      error: (err) => err.data?.message || "Failed to upload attachment.",
    });
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    deleteAttachment(attachmentId)
      .unwrap()
      .then(() => toast.success("Attachment deleted!"))
      .catch(() => toast.error("Failed to delete attachment."));
  };

  const handleStart = () => {
    toast.promise(startTimer({ taskId }).unwrap(), {
      loading: 'Starting timer...',
      success: 'Timer started!',
      error: (err) => err.data?.message || "Failed to start timer."
    });
  };

  const handleStop = () => {
    if (runningLog && newComment.trim()) {
      toast.promise(stopTimer({ logId: runningLog.id, commentText: newComment }).unwrap(), {
        loading: 'Stopping timer...',
        success: 'Timer stopped & work logged!',
        error: (err) => err.data?.message || "Failed to stop timer."
      }).then(() => {
        setNewComment(""); // Clear the comment box on success
      });
    } else {
      toast.error("Please describe your work before stopping the timer.");
    }
  };

  const handleDiscussionSubmit = async () => {
    if (!discussionInput.trim()) return;
    try {
      await createStandaloneComment({ taskId, text: discussionInput }).unwrap();
      setDiscussionInput("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment.");
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim()) return;
    try {
      await createStandaloneComment({ taskId, text: replyText, parentId }).unwrap();
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply posted!");
    } catch {
      toast.error("Failed to post reply.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCommentId) return;
    setIsDeleting(true);
    try {
      await deleteComment({ commentId: deletingCommentId, taskId }).unwrap();
      toast.success("Comment deleted!");
      setIsConfirmModalOpen(false);
      setDeletingCommentId(null);
    } catch {
      toast.error("Failed to delete comment.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditStart = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleEditSave = async (commentId: number) => {
    if (!editText.trim() || isUpdatingComment) return;
    try {
      await updateComment({ id: commentId, text: editText.trim(), taskId }).unwrap();
      setEditingCommentId(null);
      setEditText("");
      toast.success("Comment updated!");
    } catch {
      toast.error("Failed to update comment.");
    }
  };

  const handleDiscussionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleDiscussionSubmit();
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, parentId: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleReplySubmit(parentId);
    }
  };

  const priorityBadge: Record<string, string> = {
    Urgent:  "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    High:    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    Medium:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
    Low:     "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    Backlog: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
  };

  const isOverdue = !!formData.dueDate &&
    new Date(formData.dueDate) < new Date(new Date().toDateString()) &&
    formData.status !== Status.Completed;

  const isDirty = !!task && (
    formData.title !== task.title ||
    formData.description !== task.description ||
    formData.status !== task.status ||
    formData.priority !== task.priority ||
    formData.assignedUserId !== task.assignedUserId ||
    formData.points !== task.points ||
    (formData.tags ?? "") !== (task.tags ?? "") ||
    (formData.startDate ?? "") !== (task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "") ||
    (formData.dueDate ?? "") !== (task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "")
  );

  const handleClose = () => {
    if (isDirty) {
      setIsCloseConfirmOpen(true);
    } else {
      onClose();
    }
  };

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed top-[56px] bottom-0 right-0 z-[45] flex flex-col overflow-hidden bg-gray-50 dark:bg-dark-bg"
      style={{ left: `${sidebarWidth}px`, transition: 'left 300ms ease-in-out' }}
    >
      <ModalConfirm
        isOpen={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setDeletingCommentId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        isLoading={isDeleting}
      />
      <ModalConfirm
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={onClose}
        title="Discard Changes?"
        message="You have unsaved changes that will be lost."
        confirmLabel="Discard"
      />
      {/* ── Top Bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-dark-tertiary dark:bg-dark-secondary">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-200">{task?.project?.name ?? "Project"}</span>
          <span>/</span>
          <span className="truncate max-w-[260px]">{task?.title ?? "Task Name"}</span>
          <span>/</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">{task?.status ?? "Status"}</span>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && !isError && task && (
            <button onClick={handleSave} className="bg-blue-primary rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors">
              Save Changes
            </button>
          )}
          <button onClick={handleClose} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Loading State Skeleton */}
      {isLoading && (
        <div className="flex flex-1 overflow-hidden animate-pulse">
          {/* Left Column Skeleton */}
          <div className="flex flex-1 flex-col overflow-y-auto p-6 md:p-8 space-y-6">
            <div>
              <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div>
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div>
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
              <div className="h-16 w-full rounded-xl bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="h-12 w-full border border-dashed border-gray-300 dark:border-gray-700 rounded-xl" />
            </div>
          </div>
          {/* Right Column Skeleton */}
          <div className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-gray-200 p-5 dark:border-dark-tertiary md:flex">
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
                  <div className="h-9 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {(isError || (!isLoading && !task)) && <div className="flex flex-1 items-center justify-center"><p className="text-red-500">Error loading task details.</p></div>}

      {/* ── Content ── */}
      {task && (
        <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-dark-bg">

          {/* ─── Left Column ─── */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-dark-bg p-6 md:p-8 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            {/* Title + badges */}
            <div>
              <input
                name="title"
                value={formData.title || ""}
                onChange={handleInputChange}
                className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none dark:text-white"
                placeholder="Task title"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {formData.priority && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityBadge[formData.priority] ?? "bg-gray-100 text-gray-600"}`}>
                    <Flag size={10} /> {formData.priority}
                  </span>
                )}
                {(formData.startDate || formData.dueDate) && (
                  <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? "text-red-500 dark:text-red-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                    <Calendar size={12} />
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "?"}{" – "}
                    {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "?"}
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                    <AlertCircle size={10} /> OVERDUE
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">in list <span className="font-semibold">{task.status}</span></p>
            </div>

            {/* Overdue Banner */}
            {isOverdue && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 ring-1 ring-red-200 dark:ring-red-500/20">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">This task is overdue</p>
                  <p className="text-xs text-red-500/80 dark:text-red-400/70">
                    Due {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                    {" · "}Update the due date or mark the task as completed.
                  </p>
                </div>
              </div>
            )}

            {/* Time Tracker Banner (only in worklog tab) */}
            {activeTab === "worklog" && (
              <div className={`flex items-center justify-between rounded-xl px-5 py-3.5 ${runningLog ? "bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200 dark:ring-red-500/20" : "bg-gray-100 dark:bg-dark-secondary ring-1 ring-gray-200 dark:ring-white/5"}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${runningLog ? "bg-red-100 dark:bg-red-500/20" : "bg-white dark:bg-dark-bg shadow-sm"}`}>
                    <Clock size={16} className={runningLog ? "text-red-500" : "text-gray-500 dark:text-gray-400"} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Time spent on this task</p>
                    {runningLog && <p className="text-[10px] font-semibold text-red-500 dark:text-red-400">Timer running…</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-gray-800 dark:text-white tabular-nums">{runningLog ? elapsedTime : "--:--:--"}</span>
                  {runningLog ? (
                    <button onClick={handleStop} disabled={isStopping || !newComment.trim()} className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                      <Square size={12} /> Stop
                    </button>
                  ) : (
                    <button onClick={handleStart} disabled={isStarting} className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors">
                      <Play size={12} /> Start Timer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Description</h3>
              <textarea
                name="description"
                placeholder="Add a description…"
                value={formData.description || ""}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-dark-tertiary dark:bg-dark-secondary dark:text-white dark:placeholder-gray-600 transition"
                rows={4}
              />
            </div>

            {/* Attachments */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Attachments</h3>
              <div className="space-y-2">
                {task.attachments?.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-dark-tertiary dark:bg-dark-secondary">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                      <Paperclip size={15} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{att.fileName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${att.fileURL}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors">View</a>
                      <button onClick={() => handleDeleteAttachment(att.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors" aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <label htmlFor="file-upload" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-3 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:border-blue-500 transition-colors">
                  <Paperclip size={14} /> Add attachment
                </label>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div className="flex items-center gap-1 border-b border-gray-200 dark:border-dark-tertiary">
                <button onClick={() => setActiveTab("discussion")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "discussion" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  <MessageSquare size={14} /> Comments
                  {discussionComments.length > 0 && (() => { const t = discussionComments.reduce((s, c) => s + 1 + (c.replies?.length ?? 0), 0); return <span className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] font-semibold">{t}</span>; })()}
                </button>
                <button onClick={() => setActiveTab("worklog")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "worklog" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  <Clock size={14} /> Work Log
                  {workLogEntries.length > 0 && <span className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 text-[10px] font-semibold">{workLogEntries.length}</span>}
                </button>
              </div>

              {/* Discussion */}
              {activeTab === "discussion" && (
                <div className="mt-4 space-y-4">
                  {discussionComments.length === 0 ? (
                    <p className="text-sm italic text-gray-400">No comments yet. Start the discussion!</p>
                  ) : (
                    discussionComments.map((comment: CommentType) => {
                      const isOwn = comment.userId === loggedInUser?.userId;
                      return (
                        <div key={comment.id}>
                          <div className={`flex gap-2 items-end ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                            <CommentAvatar user={comment.user} />
                            <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                              <span className={`text-xs text-gray-400 mb-1 ${isOwn ? "text-right" : "text-left"}`}>
                                {isOwn ? "You" : (comment.user?.username || "User")} · {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ""}
                              </span>
                              {editingCommentId === comment.id ? (
                                <div className="w-full space-y-2">
                                  <MentionInput value={editText} onChange={setEditText} placeholder="Edit your comment..." rows={2} dropdownPosition="below" allowedUsers={users} />
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
                                    <button onClick={() => handleEditSave(comment.id)} disabled={isUpdatingComment || !editText.trim()} className="text-xs font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50">{isUpdatingComment ? "Saving…" : "Save"}</button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${isOwn ? "bg-blue-500 text-white rounded-br-sm" : "bg-white dark:bg-dark-secondary text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-200 dark:border-dark-tertiary"}`}>
                                  <MentionHighlighter text={comment.text} isOnDark={isOwn} />
                                </div>
                              )}
                              <div className={`mt-1 flex items-center gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                                <button onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(""); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                                  <Reply size={12} /> Reply{comment.replies && comment.replies.length > 0 ? ` (${comment.replies.length})` : ""}
                                </button>
                                {loggedInUser?.userId === comment.userId && (
                                  <button onClick={() => handleEditStart(comment)} className="text-xs text-gray-400 hover:text-blue-500 transition-colors">Edit</button>
                                )}
                                {(loggedInUser?.userId === comment.userId || loggedInUser?.role === "ADMIN") && (
                                  <button onClick={() => { setDeletingCommentId(comment.id); setIsConfirmModalOpen(true); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 ml-10 space-y-3">
                              {comment.replies.map((reply: CommentType) => {
                                const isOwnReply = reply.userId === loggedInUser?.userId;
                                return (
                                  <div key={reply.id} className={`flex gap-2 items-end ${isOwnReply ? "flex-row-reverse" : "flex-row"}`}>
                                    <CommentAvatar user={reply.user} />
                                    <div className={`max-w-[75%] flex flex-col ${isOwnReply ? "items-end" : "items-start"}`}>
                                      <span className={`text-[10px] text-gray-400 mb-0.5 ${isOwnReply ? "text-right" : "text-left"}`}>
                                        {isOwnReply ? "You" : (reply.user?.username || "User")} · {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : ""}
                                      </span>
                                      {editingCommentId === reply.id ? (
                                        <div className="w-full space-y-2">
                                          <MentionInput value={editText} onChange={setEditText} placeholder="Edit your reply..." rows={2} dropdownPosition="below" allowedUsers={users} />
                                          <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingCommentId(null)} className="text-[10px] text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
                                            <button onClick={() => handleEditSave(reply.id)} disabled={isUpdatingComment || !editText.trim()} className="text-[10px] font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50">{isUpdatingComment ? "Saving…" : "Save"}</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className={`rounded-2xl px-3 py-2 text-[13px] whitespace-pre-wrap break-words ${isOwnReply ? "bg-blue-500 text-white rounded-br-sm" : "bg-white dark:bg-dark-secondary text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-200 dark:border-dark-tertiary"}`}>
                                          <div className={`mb-1.5 px-2 py-1 text-[11px] rounded border-l-2 ${isOwnReply ? "bg-blue-600/30 border-blue-200 text-blue-100" : "bg-gray-50 dark:bg-dark-bg border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400"}`}>
                                            <span className="font-semibold">{comment.user?.username || "User"}:</span>{" "}
                                            <span className="truncate block max-w-[200px]">{comment.text}</span>
                                          </div>
                                          <MentionHighlighter text={reply.text} isOnDark={isOwnReply} />
                                        </div>
                                      )}
                                      {(loggedInUser?.userId === reply.userId || loggedInUser?.role === "ADMIN") && (
                                        <div className="mt-1 flex items-center gap-3">
                                          {loggedInUser?.userId === reply.userId && <button onClick={() => handleEditStart(reply)} className="text-[10px] text-gray-400 hover:text-blue-500 transition-colors">Edit</button>}
                                          <button onClick={() => { setDeletingCommentId(reply.id); setIsConfirmModalOpen(true); }} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={10} /></button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Inline reply input */}
                          {replyingTo === comment.id && (
                            <div className="mt-2 ml-10">
                              <div className="flex gap-2 items-center rounded-xl border border-gray-200 bg-white px-2 py-1.5 dark:border-dark-tertiary dark:bg-dark-secondary">
                                <div className="flex-1"><MentionInput placeholder={`Reply to ${comment.user?.username || "user"}…`} rows={1} value={replyText} onChange={setReplyText} onKeyDown={(e) => handleReplyKeyDown(e, comment.id)} allowedUsers={users} /></div>
                                <button onClick={() => handleReplySubmit(comment.id)} disabled={!replyText.trim()} className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"><Send size={14} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* New comment input */}
                  <div className="flex gap-3 items-end border-t border-gray-200 dark:border-dark-tertiary pt-4">
                    <div className="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-dark-tertiary dark:bg-dark-secondary">
                      <MentionInput placeholder="Add a comment… Use @ to mention" rows={2} value={discussionInput} onChange={setDiscussionInput} onKeyDown={handleDiscussionKeyDown} allowedUsers={users} />
                    </div>
                    <button onClick={handleDiscussionSubmit} disabled={!discussionInput.trim()} className="shrink-0 rounded-xl bg-blue-500 p-2.5 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Work Log */}
              {activeTab === "worklog" && (
                <div className="mt-4 space-y-4">
                  {runningLog ? (
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400"><AlertCircle size={14} /> Work Description (required to stop)</label>
                      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="e.g., Fixed the login bug…" className="w-full rounded-lg border-2 border-red-300 bg-white p-2.5 text-sm focus:border-red-500 focus:outline-none dark:border-red-500/50 dark:bg-dark-secondary dark:text-white" rows={3} />
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-400">Start the timer to log work.</p>
                  )}
                  <div className="space-y-3">
                    {workLogEntries.length === 0 ? (
                      <p className="text-sm italic text-gray-400">No work logged yet.</p>
                    ) : workLogEntries.map((log) => {
                      const fullUser = users?.find(u => u.userId === log.userId);
                      return (
                        <div key={log.id} className="flex gap-3 items-start rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-tertiary dark:bg-dark-secondary">
                          <CommentAvatar user={log.user} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold dark:text-gray-200">{log.user?.username || "User"}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
                                  <Clock size={10} />{formatLogDuration(log.startTime, log.endTime)}
                                </span>
                                {fullUser?.role && (
                                  <span className="inline-flex items-center rounded-full bg-accent-100 dark:bg-accent-500/10 px-2 py-0.5 text-[11px] font-semibold text-accent-600 dark:text-accent-400">
                                    {fullUser.role}
                                  </span>
                                )}
                                {fullUser?.department && (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-white/10">
                                    {fullUser.department}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0">{formatDistanceToNow(new Date(log.startTime), { addSuffix: true })}</span>
                            </div>
                            {log.comment && (
                              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                <MentionHighlighter text={log.comment.text} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Column (details) ─── */}
          <div className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-gray-200 bg-white p-5 dark:border-dark-tertiary dark:bg-dark-secondary [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:flex">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Author</label>
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-bg">
                  <User size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{task.author?.username || "Unknown"}</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Assignee</label>
                <select name="assignedUserId" value={formData.assignedUserId || ""} onChange={handleInputChange} disabled={usersLoading}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300">
                  <option value="">Unassigned</option>
                  {users?.filter(u => u.role !== "BUSINESS_OWNER").map((u) => <option key={u.userId} value={u.userId!}>{u.username}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Status</label>
                <select name="status" value={formData.status || ""} onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300">
                  {Object.values(Status).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Priority</label>
                <select name="priority" value={formData.priority || ""} onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300">
                  {Object.values(Priority).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate || ""} onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300" />
              </div>
              <div>
                <label className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
                  {isOverdue && <AlertCircle size={11} />}
                  Due Date{isOverdue && " · Overdue"}
                </label>
                <input type="date" name="dueDate" value={formData.dueDate || ""} onChange={handleInputChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition ${isOverdue ? "border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 focus:border-red-400" : "border-gray-200 bg-gray-50 text-gray-700 focus:border-blue-400 dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300"}`} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Tags</label>
                <input type="text" name="tags" placeholder="tag1, tag2…" value={formData.tags || ""} onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:border-blue-400 focus:outline-none dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300 dark:placeholder-gray-600" />
              </div>
              {isAdmin && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">Story Points</label>
                  <input type="number" name="points" placeholder="0" value={formData.points || ""} onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ModalEditTask;
