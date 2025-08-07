import React, { useState } from "react";
import { 
  Clock, 
  User, 
  Calendar, 
  Edit, 
  Trash2,
  FileText,
} from "lucide-react";
import { MaintenanceTask, useDeleteMaintenanceTaskMutation } from "@/state/api";
import { format } from "date-fns";
import toast from "react-hot-toast";
import ModalEditMaintenanceTask from "@/components/ModalEditMaintenanceTask";
import ModalConfirm from "@/components/ModalConfirm";

type Props = {
  task: MaintenanceTask;
};

const MaintenanceTaskCard = ({ task }: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [deleteMaintenanceTask, { isLoading: isDeleting }] = useDeleteMaintenanceTaskMutation();

  const formatDuration = (seconds: number = 0) => {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : "", s > 0 ? `${s}s` : ""]
      .filter(Boolean)
      .join(" ");
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMaintenanceTask(task.id).unwrap();
      toast.success("Task deleted successfully!");
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                          error.data && typeof error.data === 'object' && 'message' in error.data
                          ? (error.data as { message: string }).message
                          : "Failed to delete task";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-dark-tertiary">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 mt-0.5 text-gray-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                {task.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Maintenance Log Entry
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-600 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {task.description}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-2">
          {task.priority && (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor()}`}>
              {task.priority}
            </span>
          )}
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {task.type}
          </span>
        </div>

        {/* Assignee */}
        {task.assignedTo && (
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Assigned to {task.assignedTo.username}
            </span>
          </div>
        )}

        {/* Time estimates and logged */}
        {(task.estimatedHours || task.actualHours || (task.totalTimeLogged && task.totalTimeLogged > 0)) && (
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {task.estimatedHours && `Est: ${task.estimatedHours}h`}
              {task.estimatedHours && (task.actualHours || (task.totalTimeLogged && task.totalTimeLogged > 0)) && " | "}
              {task.actualHours && `Actual: ${task.actualHours}h`}
              {task.actualHours && (task.totalTimeLogged && task.totalTimeLogged > 0) && " | "}
              {(task.totalTimeLogged && task.totalTimeLogged > 0) && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Logged: {formatDuration(task.totalTimeLogged)}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Created info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(task.createdAt), "MMM dd, yyyy 'at' HH:mm")}</span>
          </div>
          {task.createdBy && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>by {task.createdBy.username}</span>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <ModalEditMaintenanceTask
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />

      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Maintenance Log"
        message={`Are you sure you want to delete this maintenance log entry "${task.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
};

export default MaintenanceTaskCard;
