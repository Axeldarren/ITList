import Modal from "@/components/Modal";
// Import the necessary hooks and types
import { Priority, Status, useCreateTaskMutation, useGetProjectUsersQuery, useGetUsersQuery } from "@/state/api";
import React, { useState } from "react";
import { formatISO } from "date-fns";
import toast from 'react-hot-toast';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null; // This is the projectId
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  
  // --- NEW: Fetch all users for the Author dropdown ---
  const { data: allUsers, isLoading: allUsersLoading } = useGetUsersQuery();

  // --- EXISTING: Fetch project-specific users for the Assignee dropdown ---
  const { data: projectUsers, isLoading: projectUsersLoading } = useGetProjectUsersQuery(
    Number(id), 
    { skip: !id }
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Backlog);
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [authorUserId, setAuthorUserId] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [projectId, setProjectId] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus(Status.ToDo);
    setPriority(Priority.Backlog);
    setTags("");
    setStartDate("");
    setDueDate("");
    setAuthorUserId("");
    setAssignedUserId("");
    setProjectId("");
  };

  const handleSubmit = async () => {
    if (!title || !authorUserId || !(id || projectId)) return;

    const formattedStartDate = startDate ? formatISO(new Date(startDate)) : undefined;
    const formattedDueDate = dueDate ? formatISO(new Date(dueDate)) : undefined;

    const promise = createTask({
        title,
        description,
        status,
        priority,
        tags,
        startDate: formattedStartDate,
        dueDate: formattedDueDate,
        authorUserId: parseInt(authorUserId),
        assignedUserId: assignedUserId ? parseInt(assignedUserId) : undefined,
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

  const isFormValid = () => {
    return title && authorUserId && (id || projectId);
  };

  const sharedStyles = "w-full rounded border p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lightModeStyles = "border-gray-300 bg-white text-black";
  const darkModeStyles = "dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white";
  
  const inputStyles = `${sharedStyles} ${lightModeStyles} ${darkModeStyles}`;
  const selectStyles = `${sharedStyles} ${lightModeStyles} ${darkModeStyles}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          className={inputStyles}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className={inputStyles}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select
            className={selectStyles}
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className={selectStyles}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        
        {/* --- Author and Assignee Select Dropdowns --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* --- UPDATED: Author dropdown now uses allUsers --- */}
            <select
              className={selectStyles}
              value={authorUserId}
              onChange={(e) => setAuthorUserId(e.target.value)}
              disabled={allUsersLoading}
              required
            >
              <option value="">Select Author</option>
              {allUsers?.map(user => <option key={user.userId} value={user.userId}>{user.username}</option>)}
            </select>
            
            {/* --- Assignee dropdown still uses projectUsers --- */}
            <select
              className={selectStyles}
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              disabled={projectUsersLoading}
            >
              <option value="">Assign to User (Optional)</option>
              {projectUsers?.map(user => <option key={user.userId} value={user.userId}>{user.username}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            type="date"
            className={inputStyles}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className={inputStyles}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <input
          type="text"
          className={inputStyles}
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        
        {!id && (
          <input
            type="text"
            className={inputStyles}
            placeholder="Project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          />
        )}

        <button
          type="submit"
          className={`mt-4 flex w-full justify-center rounded-md border border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus-offset-2 ${
            !isFormValid() || isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;