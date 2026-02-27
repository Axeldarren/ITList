import React, { useState, useEffect } from "react";
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
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/state/api";
import {
  X,
  Paperclip,
  MessageSquare,
  User,
  Calendar,
  Hash,
  Flag,
  CircleDot,
  Trash2,
  Tag,
  Square,
  Play,
  AlertCircle,
  Clock,
  Reply,
  Send,
  List, // Added
} from "lucide-react";
import toast from "react-hot-toast";
import { differenceInSeconds, format, formatDistanceToNow } from "date-fns";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import Image from "next/image";
import MentionInput from "@/components/MentionInput";
import MentionHighlighter from "@/components/MentionHighlighter";

const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "00:00:00";
    return new Date(seconds * 1000).toISOString().substring(11, 19);
};

const formatLogDuration = (startTime: string, endTime?: string | null): string => {
    if (!endTime) return "In progress...";
    const seconds = differenceInSeconds(new Date(endTime), new Date(startTime));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
};

// Comment Avatar Component
const CommentAvatar = ({ user }: { user?: { username?: string; profilePictureUrl?: string } }) => {
  const [imageError, setImageError] = useState(false);
  const hasProfilePicture = user?.profilePictureUrl && !imageError;

  if (hasProfilePicture) {
    return (
      <Image
        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${user.profilePictureUrl}`}
        alt={user.username || "User"}
        width={32}
        height={32}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
        onError={() => setImageError(true)}
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

  // Component State
  const [formData, setFormData] = useState<Partial<TaskType>>({});
  const [newComment, setNewComment] = useState("");
  const [discussionInput, setDiscussionInput] = useState("");
  const [activeTab, setActiveTab] = useState<"discussion" | "worklog">(initialTab);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const runningLog = task?.timeLogs?.find(log => log.userId === loggedInUser?.userId && !log.endTime);

  // Work log entries (comments linked to timeLogs)
  const workLogEntries = task?.timeLogs?.filter(log => log.endTime).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  ) || [];

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
      .then(() => toast.success("Task updated successfully!"))
      .catch(() => toast.error("Failed to update task."))
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

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId).unwrap();
      toast.success("Comment deleted!");
    } catch {
      toast.error("Failed to delete comment.");
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

  if (isLoading)
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Loading Task...
      </div>
    );
  if (isError || !task)
    return (
      <div className="p-6 text-center text-red-500">
        Error loading task details.
      </div>
    );

  return (
    <div
      className="bg-opacity-70 fixed inset-0 z-50 flex h-full w-full items-start justify-center overflow-y-auto bg-black p-4 pt-12"
    >
      <div
        className="dark:bg-dark-secondary relative w-full max-w-4xl rounded-lg bg-gray-100 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <button
            onClick={handleSave}
            className="bg-blue-primary rounded px-4 py-1.5 font-semibold text-white hover:bg-blue-600"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <input
          name="title"
          value={formData.title || ""}
          onChange={handleInputChange}
          className="w-2/3 bg-transparent text-2xl font-bold text-gray-900 focus:outline-none dark:text-white"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          in list <span className="font-semibold">{task.status}</span>
        </p>

        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
          <div className="space-y-8 md:col-span-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold dark:text-white">
                Description
              </h3>
              <textarea
                name="description"
                placeholder="Write a description"
                value={formData.description || ""}
                onChange={handleInputChange}
                className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
                rows={5}
              />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Paperclip size={20} />
                <h3 className="text-lg font-semibold dark:text-white">
                  Attachments
                </h3>
              </div>
              <div className="mt-2 space-y-2">
                {task.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="dark:bg-dark-tertiary flex items-center justify-between rounded bg-gray-200 p-2"
                  >
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${att.fileURL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow hover:underline dark:text-gray-200"
                    >
                      {att.fileName}
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="ml-4 rounded-full p-1 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/50"
                      aria-label="Delete attachment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div>
                  <label
                    htmlFor="file-upload"
                    className="dark:bg-dark-tertiary block w-full cursor-pointer rounded bg-gray-200 p-2 text-center hover:bg-gray-300 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Add an attachment
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            {/* ─── Tabbed Activity Section ─── */}
            <div>
              <div className="flex items-center border-b border-gray-200 dark:border-dark-tertiary">
                <button
                  onClick={() => setActiveTab("discussion")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "discussion"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <MessageSquare size={16} />
                  Discussion
                  {discussionComments.length > 0 && (
                    <span className="ml-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[11px] font-semibold">
                      {discussionComments.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("worklog")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "worklog"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <Clock size={16} />
                  Work Log
                  {workLogEntries.length > 0 && (
                    <span className="ml-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 text-[11px] font-semibold">
                      {workLogEntries.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ─── Discussion Tab ─── */}
              {activeTab === "discussion" && (
                <div className="mt-4">
                  {/* Comment list */}
                  <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
                    {discussionComments.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No comments yet. Start the discussion!</p>
                    ) : (
                      discussionComments.map((comment: CommentType) => (
                        <div key={comment.id}>
                          {/* Top-level comment */}
                          <div className="flex gap-3">
                            <CommentAvatar user={comment.user} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold dark:text-gray-200">
                                  {comment.user?.username || "User"}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                                </span>
                              </div>
                              <div className="dark:bg-dark-bg mt-1 rounded bg-white p-2.5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                <MentionHighlighter text={comment.text} />
                              </div>
                              <div className="mt-1 flex items-center gap-3">
                                <button
                                  onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(""); }}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <Reply size={12} /> Reply
                                  {comment.replies && comment.replies.length > 0 && (
                                    <span className="ml-1">({comment.replies.length})</span>
                                  )}
                                </button>
                                {(loggedInUser?.userId === comment.userId || loggedInUser?.role === 'ADMIN') && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-11 mt-2 space-y-3 border-l-2 border-gray-200 dark:border-dark-tertiary pl-4">
                              {comment.replies.map((reply: CommentType) => (
                                <div key={reply.id} className="flex gap-3">
                                  <CommentAvatar user={reply.user} />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold dark:text-gray-200">
                                        {reply.user?.username || "User"}
                                      </span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : ''}
                                      </span>
                                    </div>
                                    <div className="dark:bg-dark-bg mt-1 rounded bg-white p-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                      <MentionHighlighter text={reply.text} />
                                    </div>
                                    <div className="mt-1 flex items-center gap-3">
                                      {(loggedInUser?.userId === reply.userId || loggedInUser?.role === 'ADMIN') && (
                                        <button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 size={10} /> Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline reply input */}
                          {replyingTo === comment.id && (
                            <div className="ml-11 mt-2 pl-4">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <MentionInput
                                    placeholder={`Reply to ${comment.user?.username || "user"}... Use @ to mention`}
                                    rows={1}
                                    value={replyText}
                                    onChange={setReplyText}
                                    onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                                  />
                                </div>
                                <button
                                  onClick={() => handleReplySubmit(comment.id)}
                                  disabled={!replyText.trim()}
                                  className="self-end rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
                                >
                                  <Send size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* New comment input */}
                  <div className="flex gap-2 border-t border-gray-200 dark:border-dark-tertiary pt-3">
                    <div className="flex-1">
                      <MentionInput
                        placeholder="Write a comment... Use @ to mention users"
                        rows={2}
                        value={discussionInput}
                        onChange={setDiscussionInput}
                        onKeyDown={handleDiscussionKeyDown}
                      />
                    </div>
                    <button
                      onClick={handleDiscussionSubmit}
                      disabled={!discussionInput.trim()}
                      className="self-end rounded-lg bg-blue-500 p-2.5 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Work Log Tab ─── */}
              {activeTab === "worklog" && (
                <div className="mt-4">
                  {/* Timer input (only when timer is running) */}
                  {runningLog ? (
                    <div className="mb-4">
                      <label className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                        <AlertCircle size={16}/>
                        Work Description (Required to stop timer)
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="e.g., Fixed the bug in the login API..."
                        className="dark:border-red-500/50 dark:bg-dark-bg w-full rounded border-2 border-red-300 p-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div className="mb-4 text-sm text-gray-500 italic">
                      Start the timer to log work.
                    </div>
                  )}

                  {/* Work log entries */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {workLogEntries.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No work logged yet.</p>
                    ) : (
                      workLogEntries.map((log) => (
                        <div key={log.id} className="flex gap-3 items-start">
                          <CommentAvatar user={log.user} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold dark:text-gray-200">
                                  {log.user?.username || "User"}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
                                  <Clock size={10} />
                                  {formatLogDuration(log.startTime, log.endTime)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatDistanceToNow(new Date(log.startTime), { addSuffix: true })}
                              </span>
                            </div>
                            {log.comment && (
                              <div className="dark:bg-dark-bg mt-1 rounded bg-white p-2.5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                <MentionHighlighter text={log.comment.text} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 md:col-span-1">
            <div className="rounded bg-white p-3 dark:bg-dark-tertiary shadow">
              <h3 className="font-semibold mb-2 dark:text-white">Time Tracker</h3>
              {runningLog ? (
                <div className="space-y-2">
                  <div className="text-center text-2xl font-semibold font-mono dark:text-white">{elapsedTime}</div>
                  <button onClick={handleStop} disabled={isStopping || !newComment.trim()} className="w-full flex items-center justify-center gap-2 rounded bg-red-500 px-4 py-2 text-white font-semibold hover:bg-red-600 disabled:opacity-50">
                    <Square size={16} /> Stop Timer
                  </button>
                </div>
              ) : (
                <button onClick={handleStart} disabled={isStarting} className="w-full flex items-center justify-center gap-2 rounded bg-green-500 px-4 py-2 text-white font-semibold hover:bg-green-600">
                  <Play size={16} /> Start Timer
                </button>
              )}
            </div>
            <h3 className="text-lg font-semibold dark:text-white">Details</h3>
            <div className="flex items-center gap-4 mb-2">
              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div className="dark:border-dark-tertiary dark:bg-dark-tertiary w-full rounded border border-gray-300 p-2 dark:text-white bg-gray-100">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Author: </span>
              <span>
                {task.author?.username || "Unknown"}
              </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                name="assignedUserId"
                value={formData.assignedUserId || "Unassigned"}
                onChange={handleInputChange}
                disabled={usersLoading}
                className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
              >
              <option value="">Unassigned</option>
                {users?.filter(u => u.role !== 'BUSINESS_OWNER').map((user) => (
                  <option key={user.userId} value={user.userId!}>
                  {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <CircleDot className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleInputChange}
                className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
              >
                {Object.values(Status).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <Flag className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                name="priority"
                value={formData.priority || ""}
                onChange={handleInputChange}
                className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
              >
                {Object.values(Priority).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div className="w-full space-y-2">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate || ""}
                  onChange={handleInputChange}
                  className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
                />
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate || ""}
                  onChange={handleInputChange}
                  className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                name="tags"
                placeholder="Tags (comma-separated)"
                value={formData.tags || ""}
                onChange={handleInputChange}
                className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <input
                type="number"
                name="points"
                placeholder="Story Points"
                value={formData.points || ""}
                onChange={handleInputChange}
                readOnly={!isAdmin}
                className={`dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white ${!isAdmin ? 'cursor-default bg-gray-50 dark:bg-gray-800' : ''}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEditTask;