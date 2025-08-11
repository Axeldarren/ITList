import React, { useState, useMemo } from "react";
import Modal from "@/components/Modal";
import Calendar from "@/components/Calendar";
import { useGetAllTasksQuery } from "@/state/api";
import { format, parseISO } from "date-fns";
import { CheckCircle, Calendar as CalendarIcon, Flag, Folder, Filter, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ModalViewCompletedTasksProps {
  isOpen: boolean;
  onClose: () => void;
  developer: {
    userId: number;
    username: string;
    profilePictureUrl?: string;
    isAdmin?: boolean;
  };
  selectedMonth: string;
}

const ModalViewCompletedTasks: React.FC<ModalViewCompletedTasksProps> = ({
  isOpen,
  onClose,
  developer,
  selectedMonth,
}) => {
  const [selectedDate, setSelectedDate] = useState('all');
  const router = useRouter();
  
  const { data: allTasks = [], isLoading } = useGetAllTasksQuery();

  // Get completed tasks for this developer in the selected month
  const completedTasks = useMemo(() => {
    const monthStart = new Date(`${selectedMonth}-01`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    return allTasks.filter(task => {
      const isCompleted = task.status === 'Completed';
      const isAssignedToUser = task.assignedUserId === developer.userId;
      const completedInMonth = task.updatedAt && 
        new Date(task.updatedAt) >= monthStart && 
        new Date(task.updatedAt) <= monthEnd;
      
      return isCompleted && isAssignedToUser && completedInMonth;
    }).sort((a, b) => {
      // Sort by completion date (most recent first)
      if (!a.updatedAt || !b.updatedAt) return 0;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [allTasks, developer.userId, selectedMonth]);

  // Filter tasks by selected date
  const filteredTasks = useMemo(() => {
    if (selectedDate === 'all') return completedTasks;
    
    return completedTasks.filter(task => {
      if (!task.updatedAt) return false;
      const taskDate = format(parseISO(task.updatedAt), 'yyyy-MM-dd');
      return taskDate === selectedDate;
    });
  }, [completedTasks, selectedDate]);

  // Group tasks by completion date for date selector
  const tasksByDate = useMemo(() => {
    const grouped = completedTasks.reduce((acc, task) => {
      if (!task.updatedAt) return acc;
      const date = format(parseISO(task.updatedAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {} as Record<string, typeof completedTasks>);

    // Sort dates in descending order
    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, date) => {
        acc[date] = grouped[date];
        return acc;
      }, {} as Record<string, typeof completedTasks>);
  }, [completedTasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "text-red-600";
      case "High": return "text-orange-600";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-green-600";
      case "Backlog": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    return <Flag size={14} className={getPriorityColor(priority)} />;
  };

  const handleTaskClick = (task: { projectId?: number }) => {
    if (task.projectId) {
      onClose();
      router.push(`/projects/${task.projectId}`);
    }
  };

  const monthName = format(new Date(`${selectedMonth}-01`), 'MMMM yyyy');

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="">
      <div className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
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
                  {developer.username}&apos;s Completed Tasks
                </h3>
                {developer.isAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {monthName} • {completedTasks.length} tasks completed
              </p>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by completion date:
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate('all')}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  selectedDate === 'all'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-dark-tertiary text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                All Dates ({completedTasks.length})
              </button>
              <Calendar
                value={selectedDate === 'all' ? '' : selectedDate}
                onChange={(date) => setSelectedDate(date)}
                placeholder="Select specific date"
                className="min-w-[200px]"
                highlightedDates={Object.keys(tasksByDate)}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedDate === 'all' ? 'Total Completed' : `Completed on ${format(new Date(selectedDate), 'MMM dd')}`}
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {filteredTasks.length} tasks
              </span>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading completed tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {selectedDate === 'all' 
                ? `No completed tasks found for ${monthName}`
                : `No tasks completed on ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="p-4 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
              >
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
                      {getPriorityIcon(task.priority)}
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {task.project && (
                      <div className="flex items-center gap-1">
                        <Folder size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {task.project.name}
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

                  {task.updatedAt && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon size={12} className="text-green-500" />
                      <span className="text-xs text-green-600 font-medium">
                        Completed: {format(new Date(task.updatedAt), "MMM dd, h:mm a")}
                      </span>
                    </div>
                  )}
                </div>

                {task.tags && typeof task.tags === 'string' && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.split(',').slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                    {task.tags.split(',').length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{task.tags.split(',').length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalViewCompletedTasks;
