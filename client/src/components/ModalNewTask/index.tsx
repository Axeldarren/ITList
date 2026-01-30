import Modal from "@/components/Modal";
import { Priority, Status, useCreateTaskMutation, useGetProjectUsersQuery } from "@/state/api";
import React, { useState, KeyboardEvent } from "react";
import { formatISO } from "date-fns";
import toast from 'react-hot-toast';
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { X } from "lucide-react";
import { ButtonSpinner } from "@/components/LoadingSpinner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const loggedInUser = useAppSelector(selectCurrentUser);

  const { data: projectUsers, isLoading: projectUsersLoading } = useGetProjectUsersQuery(
    Number(id), 
    { skip: !id }
  );

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Backlog);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [points, setPoints] = useState("");
  const [projectId, setProjectId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus(Status.ToDo);
    setPriority(Priority.Backlog);
    setStartDate("");
    setDueDate("");
    setAssignedUserId("");
    setPoints("");
    setProjectId("");
    setTags([]);
    setTagInput("");
  };

  const handleSubmit = async () => {
    if (!title || !points || !(id || projectId)) return;
    
    // Additional check to ensure user is loaded before proceeding
    if (!loggedInUser?.userId) {
      toast.error('User session not loaded. Please try again.');
      return;
    }

    const promise = createTask({
        title,
        description,
        status,
        priority,
        tags: tags.join(','),
        startDate: startDate ? formatISO(new Date(startDate)) : undefined,
        dueDate: dueDate ? formatISO(new Date(dueDate)) : undefined,
        points: points ? Number(points) : undefined,
        authorUserId: loggedInUser.userId,
        assignedUserId: assignedUserId && assignedUserId !== "" ? assignedUserId : undefined,
        projectId: id ? Number(id) : Number(projectId),
    }).unwrap();

    toast.promise(promise, {
        loading: 'Creating task...',
        success: (data) => {
            resetForm();
            onClose();
            return `Task "${data.title}" created successfully!`;
        },
        error: 'Failed to create task.'
    });
  };
  
  const isFormValid = () => title && points && (id || projectId) && loggedInUser?.userId;

  const sharedStyles = "w-full rounded border p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lightModeStyles = "border-gray-300 bg-white text-black";
  const darkModeStyles = "dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white";
  
  const inputStyles = `${sharedStyles} ${lightModeStyles} ${darkModeStyles}`;
  const selectStyles = `${inputStyles}`;

  return (
  <Modal isOpen={isOpen} onClose={onClose} name="Create New Task" closeOnBackdropClick={false}>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      >
        <input type="text" className={inputStyles} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className={inputStyles} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select className={selectStyles} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={selectStyles} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        
        {/* --- THIS IS THE FIX: Grouping Assignee and Story Points --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <select
              className={selectStyles}
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              disabled={projectUsersLoading}
            >
              <option value="">Assign to User (Optional)</option>
              {projectUsers?.map(user => <option key={user.userId} value={user.userId}>{user.username}</option>)}
            </select>
            <input
              type="number"
              className={inputStyles}
              placeholder="Story Points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="0"
              required
            />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="date" className={inputStyles} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className={inputStyles} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        {/* --- Tags Input now takes full width --- */}
        <div>
          <div className={`flex flex-wrap gap-2 p-2 min-h-[42px] ${sharedStyles} ${lightModeStyles} ${darkModeStyles}`}>
            {tags.map((tag, index) => (
              <span key={index} className="flex items-center gap-1 bg-blue-primary/20 text-blue-800 dark:text-blue-200 text-sm font-medium px-2 py-1 rounded-full">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100">
            <X size={14} />
          </button>
              </span>
            ))}
            <input
              type="text"
              className="flex-grow bg-transparent dark:text-white focus:outline-none"
              placeholder="Add tags and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
        </div>
        
        {!id && (
          <input type="text" className={inputStyles} placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} required />
        )}

        <button
          type="submit"
          className={`mt-4 flex w-full justify-center rounded-md border border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus-offset-2 ${
            !isFormValid() || isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <ButtonSpinner />
              <span>Creating...</span>
            </div>
          ) : (
            "Create Task"
          )}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;