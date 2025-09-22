import React from "react";
import Modal from "@/components/Modal";
import { Task, Project } from "@/state/api";
import { format, isAfter } from "date-fns";
import { Calendar, Flag, Folder, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ModalViewAllTasksProps {
  isOpen: boolean;
  onClose: () => void;
  developer: {
    userId: number;
    username: string;
    email: string;
    profilePictureUrl?: string;
    isAdmin?: boolean;
  };
  tasks: Task[];
  projects: Map<number, Project>;
}

const ModalViewAllTasks: React.FC<ModalViewAllTasksProps> = ({
  isOpen,
  onClose,
  developer,
  tasks,
  projects,
}) => {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Do":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "Work In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "text-red-600";
      case "High":
        return "text-orange-600";
      case "Medium":
        return "text-yellow-600";
      case "Low":
        return "text-green-600";
      case "Backlog":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "🔥";
      case "High":
        return "⚡";
      case "Medium":
        return "📋";
      case "Low":
        return "📝";
      case "Backlog":
        return "📦";
      default:
        return "📋";
    }
  };

  const handleTaskClick = (task: Task) => {
    onClose();
    router.push(`/projects/${task.projectId}`);
  };

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    const status = task.status || "Unknown";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const statusOrder = ["To Do", "Work In Progress", "Under Review"];

  return (
  <Modal isOpen={isOpen} onClose={onClose} name={`${developer.username}'s Tasks`} closeOnBackdropClick>
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Developer Header */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
          <div className="flex items-center gap-3">
            {developer.profilePictureUrl ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${developer.profilePictureUrl}`}
                alt={developer.username}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg">
                {developer.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {developer.username}
                </h3>
                {developer.isAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {developer.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {tasks.length} active tasks
              </p>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No active tasks assigned
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {statusOrder.map((status) => {
              const statusTasks = tasksByStatus[status] || [];
              if (statusTasks.length === 0) return null;

              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                      {status}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                      {statusTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {statusTasks.map((task) => {
                      const project = projects.get(task.projectId);
                      const isOverdue = task.id && // Ensure task has an ID (not a new task)
                                        task.dueDate && 
                                        task.status !== 'Under Review' && 
                                        task.status !== 'Completed' &&
                                        new Date(task.dueDate).getTime() > 0 && // Ensure valid date
                                        isAfter(new Date(), new Date(task.dueDate));

                      return (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={`p-3 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow cursor-pointer group relative ${isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}`}
                        >
                          {/* Overdue stamp */}
                          {isOverdue && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full transform rotate-12 shadow-md z-[1]">
                              OVERDUE
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {task.title}
                                </h5>
                                <ExternalLink size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              {task.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            
                            {task.priority && (
                              <div className="flex items-center gap-1 ml-2">
                                <span className="text-sm">{getPriorityIcon(task.priority)}</span>
                                <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {project && (
                                <div className="flex items-center gap-1">
                                  <Folder size={12} className="text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {project.name}
                                  </span>
                                </div>
                              )}
                              
                              {task.points && (
                                <div className="flex items-center gap-1">
                                  <Flag size={12} className="text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {task.points} pts
                                  </span>
                                </div>
                              )}
                            </div>

                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className={isOverdue ? "text-red-500" : "text-gray-400"} />
                                <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                                  {format(new Date(task.dueDate), "MMM dd, yyyy")}
                                  {isOverdue && " (Overdue)"}
                                </span>
                              </div>
                            )}
                          </div>

                          {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(task.tags as string[]).slice(0, 3).map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {(task.tags as string[]).length > 3 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{(task.tags as string[]).length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalViewAllTasks;
