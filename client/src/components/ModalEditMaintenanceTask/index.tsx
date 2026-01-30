import React, { useState, useEffect } from "react";
import {
  MaintenanceTask,
  useUpdateMaintenanceTaskMutation,
  useGetUsersQuery,
  useGetMaintenanceTaskTimeLogsQuery,
  useGetMaintenanceTaskCommentsQuery,
  useStartMaintenanceTimerMutation,
  useStopMaintenanceTimerMutation,
  useGetProductMaintenanceByIdQuery,
  useGetTicketsWithStatusOpenQuery,
} from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { differenceInSeconds } from "date-fns";
import { Play, Square } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  task: MaintenanceTask;
};

const ModalEditMaintenanceTask = ({ isOpen, onClose, task }: Props) => {
  const loggedInUser = useAppSelector(selectCurrentUser);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [type, setType] = useState("General");
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");
  const [actualHours, setActualHours] = useState<number | "">("");
  const [assignedToId, setAssignedToId] = useState<string | "">("");
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [workDescription, setWorkDescription] = useState("");
  const [ticketId, setTicketId] = useState<string>("");

  const [updateMaintenanceTask, { isLoading: isUpdating }] =
    useUpdateMaintenanceTaskMutation();
  const [startMaintenanceTimer, { isLoading: isStarting }] =
    useStartMaintenanceTimerMutation();
  const [stopMaintenanceTimer, { isLoading: isStopping }] =
    useStopMaintenanceTimerMutation();

  const { data: users } = useGetUsersQuery();
  const { data: timeLogs } = useGetMaintenanceTaskTimeLogsQuery(task.id);
  const { data: comments } = useGetMaintenanceTaskCommentsQuery(task.id);
  const { data: productMaintenance } = useGetProductMaintenanceByIdQuery(
    task.productMaintenanceId,
  );
  const { data: ticketsOpen } = useGetTicketsWithStatusOpenQuery();

  // Filter users to only show maintainers of this product maintenance
  const availableAssignees = productMaintenance?.maintainers
    ? users?.filter((user) =>
        productMaintenance.maintainers.some(
          (maintainer) => maintainer.userId === user.userId,
        ),
      )
    : users;

  // Find running timer for current user
  const runningLog = timeLogs?.find(
    (log) => log.userId === loggedInUser?.userId && !log.endTime,
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate total time logged for this maintenance task
  const totalTimeLogged =
    timeLogs
      ?.filter((log) => log.endTime) // Only completed time logs
      ?.reduce((total, log) => total + (log.duration || 0), 0) || 0;

  const formatDurationShort = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : "", s > 0 ? `${s}s` : ""]
      .filter(Boolean)
      .join(" ");
  };

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

  // Initialize form with current task data
  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "Medium");
      setType(task.type);
      setEstimatedHours(task.estimatedHours || "");
      setActualHours(task.actualHours || "");
      setAssignedToId(task.assignedToId || "");
      setTicketId(
        task.maintenanceTaskTicket?.ticket_id
          ? String(task.maintenanceTaskTicket.ticket_id)
          : ""
      );
    }
  }, [isOpen, task]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (runningLog) {
      interval = setInterval(() => {
        const seconds = differenceInSeconds(
          new Date(),
          new Date(runningLog.startTime),
        );
        setElapsedTime(formatDuration(seconds));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningLog]);

  const handleStartTimer = async () => {
    if (!loggedInUser?.userId) return;

    try {
      await startMaintenanceTimer({
        maintenanceTaskId: task.id,
        description: "Started working on maintenance task",
      }).unwrap();
      toast.success("Timer started!");
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
          ? (error.data as { message: string }).message
          : "Failed to start timer";
      toast.error(errorMessage);
    }
  };

  const handleStopTimer = async () => {
    if (!runningLog || !workDescription.trim()) return;

    try {
      await stopMaintenanceTimer({
        maintenanceTaskId: task.id,
        workDescription: workDescription,
      }).unwrap();
      toast.success("Timer stopped and work logged!");
      setWorkDescription("");
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
          ? (error.data as { message: string }).message
          : "Failed to stop timer";
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    try {
      await updateMaintenanceTask({
        id: task.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        type,
        estimatedHours: estimatedHours || undefined,
        actualHours: actualHours || undefined,
        assignedToId: assignedToId || undefined,
        ticket_id: ticketId || undefined,
      }).unwrap();
      toast.success("Maintenance task updated successfully!");
      onClose();
    } catch (error) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
          ? (error.data as { message: string }).message
          : "Failed to update maintenance task";
      toast.error(errorMessage);
    }
  };

  return (
  <Modal isOpen={isOpen} onClose={onClose} name="Edit Maintenance Task" closeOnBackdropClick={false}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium dark:text-white"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
            placeholder="Enter task title..."
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium dark:text-white"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
            placeholder="Describe the task..."
          />
        </div>

        {/* Type */}
        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-sm font-medium dark:text-white"
          >
            Task Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
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
          <label
            htmlFor="priority"
            className="mb-2 block text-sm font-medium dark:text-white"
          >
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Hours */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="estimatedHours"
              className="mb-2 block text-sm font-medium dark:text-white"
            >
              Estimated Hours
            </label>
            <input
              type="number"
              id="estimatedHours"
              value={estimatedHours}
              onChange={(e) =>
                setEstimatedHours(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              step="0.5"
              className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
              placeholder="e.g., 4.5"
            />
          </div>

          <div>
            <label
              htmlFor="actualHours"
              className="mb-2 block text-sm font-medium dark:text-white"
            >
              Actual Hours
            </label>
            <input
              type="number"
              id="actualHours"
              value={actualHours}
              onChange={(e) =>
                setActualHours(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              step="0.5"
              className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
              placeholder="e.g., 3.0"
            />
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label
            htmlFor="assignedTo"
            className="mb-2 block text-sm font-medium dark:text-white"
          >
            Assign To
          </label>
          <select
            id="assignedTo"
            value={assignedToId}
            onChange={(e) =>
              setAssignedToId(e.target.value ?? "")
            }
            className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
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
        <div className="flex flex-col">
          <label
            htmlFor="ticketId"
            className="mb-2 block text-sm font-medium dark:text-white"
          >
            Ticket
          </label>
          <select
            id="ticketId"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
          >
            <option value="">No Ticket</option>
            {ticketsOpen?.map((ticket) => (
              <option key={ticket.ticket_id} value={String(ticket.ticket_id)}>
                {ticket.ticket_id} - {ticket.description_ticket}
              </option>
            ))}
          </select>
        </div>

        {/* Timer Section */}
        <div className="dark:bg-dark-secondary rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
            Time Tracker
          </h3>

          {runningLog ? (
            <div className="space-y-3">
              <div className="text-center font-mono text-2xl font-semibold text-green-600 dark:text-green-400">
                {elapsedTime}
              </div>

              <div>
                <label
                  htmlFor="workDescription"
                  className="mb-2 block text-sm font-medium dark:text-white"
                >
                  Work Description (Required to stop timer)
                </label>
                <textarea
                  id="workDescription"
                  rows={2}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="dark:bg-dark-tertiary w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
                  placeholder="Describe what you worked on..."
                />
              </div>

              <button
                type="button"
                onClick={handleStopTimer}
                disabled={isStopping || !workDescription.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                <Square size={16} /> Stop Timer
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartTimer}
              disabled={isStarting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600 disabled:opacity-50"
            >
              <Play size={16} /> Start Timer
            </button>
          )}
        </div>

        {/* Comments Section */}
        <div className="dark:bg-dark-secondary rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Work Log & Comments
            </h3>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total: {formatDurationShort(totalTimeLogged)}
            </div>
          </div>

          <div className="max-h-60 space-y-3 overflow-y-auto">
            {comments && comments.length > 0 ? (
              comments.map((comment) => {
                // Find the associated time log for this comment
                const associatedTimeLog = timeLogs?.find(
                  (log) =>
                    log.comment?.id === comment.id ||
                    (log.endTime &&
                      Math.abs(
                        new Date(log.endTime).getTime() -
                          new Date(comment.createdAt).getTime(),
                      ) < 5000),
                );

                return (
                  <div
                    key={comment.id}
                    className="dark:bg-dark-tertiary rounded border border-gray-200 bg-white p-3 dark:border-gray-600"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.user?.username || "Unknown User"}
                        </span>
                        {associatedTimeLog?.duration && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {formatDurationShort(associatedTimeLog.duration)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {comment.text}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                No work logs yet. Start the timer and add some work descriptions
                to see them here.
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-blue-primary rounded-lg px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalEditMaintenanceTask;
