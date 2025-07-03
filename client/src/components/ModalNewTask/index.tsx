import Modal from "@/components/Modal";
import { Priority, Status, useCreateTaskMutation, useGetProjectUsersQuery, useGetUsersQuery } from "@/state/api";
import React, { useEffect, useState } from "react";
import { formatISO } from "date-fns";
import toast from 'react-hot-toast';
import Select from "../Select";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Backlog);
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [authorUserId, setAuthorUserId] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(id || "");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { data: allUsers, isLoading: isLoadingAllUsers } = useGetUsersQuery();
  
  const { data: teamUsers, isLoading: isLoadingTeamUsers } = useGetProjectUsersQuery(Number(projectId), {
    skip: !projectId,
  });

  useEffect(() => {
    if (id) {
      setProjectId(id);
    }
    if (!isOpen) {
      resetForm();
    }
  }, [id, isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus(Status.ToDo);
    setPriority(Priority.Backlog);
    setTags("");
    setStartDate("");
    setDueDate("");
    setAuthorUserId(null);
    setAssignedUserId(null);
    if (!id) {
        setProjectId("");
    }
  };

  const handleDropdownToggle = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleSubmit = async () => {
    if (!title || !authorUserId || !assignedUserId || !projectId) return;

    const formattedStartDate = startDate ? formatISO(new Date(startDate), { representation: "complete" }) : undefined;
    const formattedDueDate = dueDate ? formatISO(new Date(dueDate), { representation: "complete" }) : undefined;

    const promise = createTask({
        title,
        description,
        status,
        priority,
        tags,
        startDate: formattedStartDate,
        dueDate: formattedDueDate,
        authorUserId: parseInt(authorUserId),
        assignedUserId: parseInt(assignedUserId),
        projectId: Number(projectId),
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
    return title && authorUserId && assignedUserId && projectId;
  };

  const selectStyles = "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";
  const inputStyles = "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
      <form
        className="mt-4 space-y-6"
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
        />
        <textarea
          className={inputStyles}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <select
            className={selectStyles}
            value={status}
            onChange={(e) =>
              setStatus(Status[e.target.value as keyof typeof Status])
            }
          >
            <option value="">Select Status</option>
            <option value={Status.ToDo}>To Do</option>
            <option value={Status.WorkInProgress}>Work In Progress</option>
            <option value={Status.UnderReview}>Under Review</option>
            <option value={Status.Completed}>Completed</option>
          </select>
          <select
            className={selectStyles}
            value={priority}
            onChange={(e) =>
              setPriority(Priority[e.target.value as keyof typeof Priority])
            }
          >
            <option value="">Select Priority</option>
            <option value={Priority.Urgent}>Urgent</option>
            <option value={Priority.High}>High</option>
            <option value={Priority.Medium}>Medium</option>
            <option value={Priority.Low}>Low</option>
            <option value={Priority.Backlog}>Backlog</option>
          </select>
        </div>
        <input
          type="text"
          className={inputStyles}
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
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
        
        <Select
            value={authorUserId}
            onChange={setAuthorUserId}
            options={allUsers?.map(user => ({ label: user.username, value: user.userId!.toString() })) || []}
            placeholder="Select Author"
            loading={isLoadingAllUsers}
            isOpen={openDropdown === 'author'}
            onToggle={() => handleDropdownToggle('author')}
        />
        
        <Select
            value={assignedUserId}
            onChange={setAssignedUserId}
            options={teamUsers?.map(user => ({ label: user.username, value: user.userId!.toString() })) || []}
            placeholder="Select Assignee"
            loading={isLoadingTeamUsers}
            disabled={!projectId}
            key={projectId}
            isOpen={openDropdown === 'assignee'}
            onToggle={() => handleDropdownToggle('assignee')}
        />

        {id === null && (
          <input
            type="text"
            className={inputStyles}
            placeholder="ProjectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        )}
        <button
          type="submit"
          className={`focus-offset-2 mt-4 flex w-full justify-center rounded-md border border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
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