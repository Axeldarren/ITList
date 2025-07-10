import React, { useState, useEffect } from "react";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useCreateCommentMutation,
  useAddAttachmentMutation,
  useGetProjectUsersQuery,
  useDeleteAttachmentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  User as UserType,
  Task as TaskType,
  Attachment as AttachmentType,
  Comment as CommentType,
  Priority,
  Status,
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
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { filesize } from "filesize";

type Props = {
  taskId: number;
  onClose: () => void;
};

const ModalEditTask = ({ taskId, onClose }: Props) => {
  // Queries and Mutations
  const { data: task, isLoading, isError } = useGetTaskByIdQuery(taskId);
  const { data: users, isLoading: usersLoading } = useGetProjectUsersQuery(
    task?.projectId!,
    { skip: !task },
  );
  const [updateTask] = useUpdateTaskMutation();
  const [createComment] = useCreateCommentMutation();
  const [addAttachment] = useAddAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  // Component State
  const [formData, setFormData] = useState<Partial<TaskType>>({});
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

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
    if (!newComment.trim()) return;
    const currentUserId = 1;
    createComment({ taskId, text: newComment, userId: currentUserId })
      .unwrap()
      .then(() => {
        toast.success("Comment added!");
        setNewComment("");
      })
      .catch(() => toast.error("Failed to add comment."));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", String(taskId));
    formData.append("uploadedById", "1");

    const promise = addAttachment(formData).unwrap();
    toast.promise(promise, {
      loading: `Uploading ${file.name}...`,
      success: "Attachment added successfully!",
      error: (err) => err.data?.message || "Failed to upload attachment.",
    });
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    if (window.confirm("Are you sure you want to delete this attachment?")) {
      deleteAttachment(attachmentId)
        .unwrap()
        .then(() => toast.success("Attachment deleted!"))
        .catch(() => toast.error("Failed to delete attachment."));
    }
  };

  const handleEditComment = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleSaveComment = (commentId: number) => {
    if (!editingCommentText.trim()) return;
    updateComment({ id: commentId, text: editingCommentText })
      .unwrap()
      .then(() => {
        toast.success("Comment updated!");
        setEditingCommentId(null);
      })
      .catch(() => toast.error("Failed to update comment."));
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteComment(commentId)
        .unwrap()
        .then(() => toast.success("Comment deleted!"))
        .catch(() => toast.error("Failed to delete comment."));
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
              <div className="flex items-center gap-3">
                <MessageSquare size={20} />
                <h3 className="text-lg font-semibold dark:text-white">
                  Activity
                </h3>
              </div>
              <div className="mt-4 flex gap-3">
                <div className="bg-blue-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white">
                  <User size={18} />
                </div>
                <div className="w-full">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
                    rows={1}
                  />
                  {newComment && (
                    <button
                      onClick={handleAddComment}
                      className="bg-blue-primary mt-2 rounded px-4 py-1 text-sm text-white"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {task.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 text-white">
                      <User size={18} />
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold dark:text-gray-200">
                          {comment.user?.username || "User"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-1">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) =>
                              setEditingCommentText(e.target.value)
                            }
                            className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2"
                          />
                          <div className="mt-2 space-x-2">
                            <button
                              onClick={() => handleSaveComment(comment.id)}
                              className="bg-blue-primary rounded px-3 py-1 text-sm text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-sm hover:underline dark:text-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="dark:bg-dark-bg mt-1 rounded bg-white p-2 text-gray-800 dark:text-gray-200">
                          {comment.text}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-1">
            <h3 className="text-lg font-semibold dark:text-white">Details</h3>

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
                className="dark:border-dark-tertiary dark:bg-dark-bg w-full rounded border border-gray-300 p-2 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEditTask;
