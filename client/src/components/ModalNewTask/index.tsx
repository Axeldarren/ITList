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

const inputStyles = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-dark-tertiary dark:bg-dark-bg dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-500 transition-colors";
const labelStyles = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const loggedInUser = useAppSelector(selectCurrentUser);

  const { data: projectUsers, isLoading: projectUsersLoading } = useGetProjectUsersQuery(
    Number(id), 
    { skip: !id }
  );

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
    setTitle(""); setDescription(""); setStatus(Status.ToDo);
    setPriority(Priority.Backlog); setStartDate(""); setDueDate("");
    setAssignedUserId(""); setPoints(""); setProjectId("");
    setTags([]); setTagInput("");
  };

  const handleSubmit = async () => {
    if (!title || !points || !(id || projectId)) return;
    if (!loggedInUser?.userId) {
      toast.error('User session not loaded. Please try again.');
      return;
    }

    const promise = createTask({
        title, description, status, priority,
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
        success: (data) => { resetForm(); onClose(); return `Task "${data.title}" created successfully in Project "${data.project?.name || 'Unknown'}"!`; },
        error: 'Failed to create task.'
    });
  };
  
  const isFormValid = () => title && points && (id || projectId) && loggedInUser?.userId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task" closeOnBackdropClick={false}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {/* Title */}
        <div>
          <label className={labelStyles}>Title <span className="text-red-400">*</span></label>
          <input type="text" className={inputStyles} placeholder="e.g. Fix login bug" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        {/* Description */}
        <div>
          <label className={labelStyles}>Description</label>
          <textarea className={inputStyles} placeholder="Optional description…" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyles}>Status</label>
            <select className={inputStyles} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelStyles}>Priority</label>
            <select className={inputStyles} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Assignee + Story Points */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyles}>Assignee</label>
            <select className={inputStyles} value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)} disabled={projectUsersLoading}>
              <option value="">Unassigned</option>
              {projectUsers?.filter(u => u.role !== 'BUSINESS_OWNER').map(user => <option key={user.userId} value={user.userId}>{user.username}</option>)}
            </select>
          </div>
          <div>
            <label className={labelStyles}>Story Points <span className="text-red-400">*</span></label>
            <input type="number" className={inputStyles} placeholder="0" value={points} onChange={(e) => setPoints(e.target.value)} min="0" required />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyles}>Start Date</label>
            <input type="date" className={inputStyles} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={labelStyles}>Due Date</label>
            <input type="date" className={inputStyles} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={labelStyles}>Tags</label>
          <div className={`flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2 min-h-[42px] dark:border-dark-tertiary dark:bg-dark-bg focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors`}>
            {tags.map((tag, index) => (
              <span key={index} className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100"><X size={12} /></button>
              </span>
            ))}
            <input
              type="text" className="min-w-[120px] flex-grow bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500"
              placeholder="Add tag, press Enter"
              value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
            />
          </div>
        </div>
        
        {!id && (
          <div>
            <label className={labelStyles}>Project ID <span className="text-red-400">*</span></label>
            <input type="text" className={inputStyles} placeholder="Enter project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} required />
          </div>
        )}

        <button
          type="submit"
          className={`w-full rounded-lg bg-blue-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2"><ButtonSpinner /> Creating…</span>
          ) : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;