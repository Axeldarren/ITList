import React, { useState } from "react";
import {
  useCreateMaintenanceTaskMutation,
  useGetUsersQuery,
  useGetProductMaintenanceByIdQuery,
  useGetTicketsWithStatusOpenQuery,
} from "../../state/api";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { useSelector } from "react-redux";
import { RootState } from "../../app/redux";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  productMaintenanceId: number;
};

const ModalNewMaintenanceTask = ({ isOpen, onClose, productMaintenanceId }: Props) => {
  const { data: ticketsOpen } = useGetTicketsWithStatusOpenQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [type, setType] = useState("General");
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");
  const [assignedToId, setAssignedToId] = useState<string | "">("");
  const [ticketId, setTicketId] = useState<string>("");

  const [createMaintenanceTask, { isLoading: isCreating }] = useCreateMaintenanceTaskMutation();
  const { data: users } = useGetUsersQuery();
  const { data: productMaintenance } = useGetProductMaintenanceByIdQuery(productMaintenanceId);
  
  // Get the current user from the Redux store to check their admin status
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.isAdmin;

  // Filter users to only show maintainers assigned to this product maintenance
  const availableAssignees = users?.filter(user => 
    productMaintenance?.maintainers.some(maintainer => maintainer.userId === user.userId)
  ) || [];

  const taskTypes = [
    "General",
    "Optimize Query",
    "Database Migration",
    "Performance Tuning",
    "Security Update",
    "Bug Fix",
    "Code Refactoring",
    "Documentation",
    "Testing",
    "Monitoring Setup",
    "Infrastructure",
    "Deployment",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    // Only require a ticket if the user is NOT an admin
    if (!isAdmin && !ticketId) {
      toast.error("Ticket is required");
      return;
    }

    try {
      await createMaintenanceTask({
        productMaintenanceId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        type,
        estimatedHours: estimatedHours || undefined,
        assignedToId: assignedToId || undefined,
        ticket_id: ticketId || undefined, // Send ticket_id only if it has a value
      }).unwrap();

      toast.success("Maintenance task created successfully!");
      onClose();
      resetForm();
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                           error.data && typeof error.data === 'object' && 'message' in error.data
                           ? (error.data as { message: string }).message
                           : "Failed to create maintenance task";
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setType("General");
    setEstimatedHours("");
    setAssignedToId("");
    setTicketId("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
  <Modal isOpen={isOpen} onClose={handleClose} name="Create Maintenance Task" closeOnBackdropClick={false}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium dark:text-white">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            placeholder="Enter task title..."
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium dark:text-white">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            placeholder="Describe the task..."
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="mb-2 block text-sm font-medium dark:text-white">
            Task Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
          >
            {taskTypes.map((taskType) => (
              <option key={taskType} value={taskType}>
                {taskType}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="mb-2 block text-sm font-medium dark:text-white">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Estimated Hours */}
        <div>
          <label htmlFor="estimatedHours" className="mb-2 block text-sm font-medium dark:text-white">
            Estimated Hours
          </label>
          <input
            type="number"
            id="estimatedHours"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : "")}
            min="0"
            step="0.5"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            placeholder="e.g., 4.5"
          />
        </div>

        {/* Assigned To */}
        <div>
          <label htmlFor="assignedTo" className="mb-2 block text-sm font-medium dark:text-white">
            Assign To
          </label>
          <select
            id="assignedTo"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value ?? "")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
          >
            <option value="">Unassigned</option>
            {availableAssignees?.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.username}
              </option>
            ))}
          </select>
        </div>

        {/* Ticket Dropdown */}
        <div>
          <label htmlFor="ticketId" className="mb-2 block text-sm font-medium dark:text-white">
            Ticket {!isAdmin && "*"}
          </label>
          <select
            id="ticketId"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            required={!isAdmin}
          >
            <option value="">Select a Ticket</option>
            {ticketsOpen?.map((ticket) => (
              <option key={ticket.ticket_id} value={String(ticket.ticket_id)}>
                {ticket.ticket_id} - {ticket.description_ticket}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-lg bg-blue-primary px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalNewMaintenanceTask;