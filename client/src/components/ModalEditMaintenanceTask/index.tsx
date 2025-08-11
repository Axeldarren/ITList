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
  const [assignedToId, setAssignedToId] = useState<number | "">("");
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [workDescription, setWorkDescription] = useState("");

  const [updateMaintenanceTask, { isLoading: isUpdating }] = useUpdateMaintenanceTaskMutation();
  const [startMaintenanceTimer, { isLoading: isStarting }] = useStartMaintenanceTimerMutation();
  const [stopMaintenanceTimer, { isLoading: isStopping }] = useStopMaintenanceTimerMutation();
  
  const { data: users } = useGetUsersQuery();
  const { data: timeLogs } = useGetMaintenanceTaskTimeLogsQuery(task.id);
  const { data: comments } = useGetMaintenanceTaskCommentsQuery(task.id);
  const { data: productMaintenance } = useGetProductMaintenanceByIdQuery(task.productMaintenanceId);

  // Filter users to only show maintainers of this product maintenance
  const availableAssignees = productMaintenance?.maintainers 
    ? users?.filter(user => 
        productMaintenance.maintainers.some(maintainer => maintainer.userId === user.userId)
      ) 
    : users;

  // Find running timer for current user
  const runningLog = timeLogs?.find(log => 
    log.userId === loggedInUser?.userId && 
    !log.endTime
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total time logged for this maintenance task
  const totalTimeLogged = timeLogs
    ?.filter(log => log.endTime) // Only completed time logs
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
    }
  }, [isOpen, task]);

  // Timer effect
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

  const handleStartTimer = async () => {
    if (!loggedInUser?.userId) return;
    
    try {
      await startMaintenanceTimer({
        maintenanceTaskId: task.id,
        description: "Started working on maintenance task",
      }).unwrap();
      toast.success("Timer started!");
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                          error.data && typeof error.data === 'object' && 'message' in error.data
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
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                          error.data && typeof error.data === 'object' && 'message' in error.data
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
      }).unwrap();

      toast.success("Maintenance task updated successfully!");
      onClose();
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                          error.data && typeof error.data === 'object' && 'message' in error.data
                          ? (error.data as { message: string }).message
                          : "Failed to update maintenance task";
      toast.error(errorMessage);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Edit Maintenance Task">
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

        {/* Hours */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <div>
            <label htmlFor="actualHours" className="mb-2 block text-sm font-medium dark:text-white">
              Actual Hours
            </label>
            <input
              type="number"
              id="actualHours"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value ? Number(e.target.value) : "")}
              min="0"
              step="0.5"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              placeholder="e.g., 3.0"
            />
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label htmlFor="assignedTo" className="mb-2 block text-sm font-medium dark:text-white">
            Assign To
          </label>
          <select
            id="assignedTo"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value ? Number(e.target.value) : "")}
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

        {/* Timer Section */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-dark-secondary">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Time Tracker</h3>
          
          {runningLog ? (
            <div className="space-y-3">
              <div className="text-center text-2xl font-mono font-semibold text-green-600 dark:text-green-400">
                {elapsedTime}
              </div>
              
              <div>
                <label htmlFor="workDescription" className="mb-2 block text-sm font-medium dark:text-white">
                  Work Description (Required to stop timer)
                </label>
                <textarea
                  id="workDescription"
                  rows={2}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
                  placeholder="Describe what you worked on..."
                />
              </div>
              
              <button
                type="button"
                onClick={handleStopTimer}
                disabled={isStopping || !workDescription.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                <Square size={16} /> Stop Timer
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartTimer}
              disabled={isStarting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white font-semibold hover:bg-green-600 disabled:opacity-50"
            >
              <Play size={16} /> Start Timer
            </button>
          )}
        </div>

        {/* Comments Section */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-dark-secondary">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Work Log & Comments</h3>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total: {formatDurationShort(totalTimeLogged)}
            </div>
          </div>
          
          <div className="max-h-60 space-y-3 overflow-y-auto">
            {comments && comments.length > 0 ? (
              comments.map((comment) => {
                // Find the associated time log for this comment
                const associatedTimeLog = timeLogs?.find(log => 
                  log.comment?.id === comment.id || 
                  (log.endTime && Math.abs(new Date(log.endTime).getTime() - new Date(comment.createdAt).getTime()) < 5000)
                );
                
                return (
                  <div key={comment.id} className="rounded border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-dark-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.user?.username || 'Unknown User'}
                        </span>
                        {associatedTimeLog?.duration && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                            {formatDurationShort(associatedTimeLog.duration)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.text}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                No work logs yet. Start the timer and add some work descriptions to see them here.
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
            className="rounded-lg bg-blue-primary px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalEditMaintenanceTask;
