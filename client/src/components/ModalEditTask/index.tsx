import React, { useState, useEffect } from "react";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useCreateCommentMutation,
  useAddAttachmentMutation,
  useGetProjectUsersQuery,
  useDeleteAttachmentMutation,
  Task as TaskType,
  Priority,
  Status,
  useStartTimerMutation,
  useStopTimerMutation,
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
} from "lucide-react";
import toast from "react-hot-toast";
import { differenceInSeconds, format, formatDistanceToNow } from "date-fns";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import Image from "next/image";

const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "00:00:00";
    return new Date(seconds * 1000).toISOString().substring(11, 19);
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
};

const ModalEditTask = ({ taskId, onClose }: Props) => {
  // Get the current logged-in user from the Redux store
  const loggedInUser = useAppSelector(selectCurrentUser);
  const isAdmin = loggedInUser?.isAdmin || false;

  // Queries and Mutations
  const { data: task, isLoading, isError } = useGetTaskByIdQuery(taskId);
  const [startTimer, { isLoading: isStarting }] = useStartTimerMutation();
  const [stopTimer, { isLoading: isStopping }] = useStopTimerMutation();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  const { data: users, isLoading: usersLoading } = useGetProjectUsersQuery(
    task?.projectId ?? 0,
    { skip: !task || !task.projectId },
  );
  const [updateTask] = useUpdateTaskMutation();
  const [createComment] = useCreateCommentMutation();
  const [addAttachment] = useAddAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();

  // Component State
  const [formData, setFormData] = useState<Partial<TaskType>>({});
  const [newComment, setNewComment] = useState("");

  const runningLog = task?.timeLogs?.find(log => log.userId === loggedInUser?.userId && !log.endTime);

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

  const handleAddComment = () => {
    if (!newComment.trim() || !loggedInUser || !loggedInUser.userId) return;
    toast.promise(createComment({ taskId, text: newComment, userId: loggedInUser.userId }).unwrap(), {
      loading: 'Posting comment...',
      success: 'Comment added!',
      error: (err) => err.data?.message || "You must start a timer to comment."
    }).then(() => {
      setNewComment("");
    });
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
      onClick={onClose}
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

            <div>
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-3">
                <MessageSquare size={20} /> Activity
              </h3>
              
              {/* This entire block changes based on whether a timer is running */}
              {runningLog ? (
                <div className="mt-4">
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
                <div className="mt-4 flex gap-3">
                  <CommentAvatar user={{ username: loggedInUser?.username, profilePictureUrl: loggedInUser?.profilePictureUrl }} />
                  <div className="flex w-full gap-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment... (Timer must be running)"
                      className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
                      rows={1}
                    />
                    <button onClick={handleAddComment} className="bg-blue-primary rounded px-4 py-1 text-sm text-white font-semibold">
                      Send
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-4">
                {task.comments?.map((comment) => {
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <CommentAvatar user={comment.user} />
                      <div className="w-full">
                          <div className="flex items-center justify-between">
                              <span className="text-sm font-bold dark:text-gray-200">
                                  {comment.user?.username || "User"}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Unknown time'}
                              </span>
                          </div>
                          <div className="dark:bg-dark-bg mt-1 rounded bg-white p-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {comment.text}
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                {users?.map((user) => (
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