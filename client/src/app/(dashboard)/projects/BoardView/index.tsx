import {
  useDeleteTaskMutation,
  useGetTasksQuery,
  useUpdateTaskStatusMutation,
} from "@/state/api";
import React, { useState, MouseEvent, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import {
  MessageSquareMore,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Paperclip,
} from "lucide-react"; 
import { format } from "date-fns";
import Image from "next/image";
import BoardViewSkeleton from "./BoardViewSkeleton";
import toast from "react-hot-toast";
import ModalConfirm from "@/components/ModalConfirm";
import ModalEditTask from "@/components/ModalEditTask"; 

type BoardProps = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  searchTerm: string;
};

const taskStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

const BoardView = ({ id, setIsModalNewTaskOpen, searchTerm }: BoardProps) => {
  const {
    data: tasks,
    isLoading,
    error,
  } = useGetTasksQuery({ projectId: Number(id) });
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!searchTerm) return tasks;

    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowercasedSearchTerm) ||
        (task.description &&
          task.description.toLowerCase().includes(lowercasedSearchTerm)) ||
        (task.tags && task.tags.toLowerCase().includes(lowercasedSearchTerm)) ||
        (task.priority &&
          task.priority.toLowerCase().includes(lowercasedSearchTerm)),
    );
  }, [tasks, searchTerm]);

  const handleMenuToggle = (taskId: number) => {
    setOpenMenuId(openMenuId === taskId ? null : taskId);
  };

  const moveTask = (taskId: number, toStatus: string) => {
    updateTaskStatus({ taskId, status: toStatus });
  };

  if (isLoading) return <BoardViewSkeleton />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        An error occurred while fetching tasks.
      </div>
    );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={filteredTasks}
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
            openMenuId={openMenuId}
            onMenuToggle={handleMenuToggle}
          />
        ))}
      </div>
    </DndProvider>
  );
};

interface TaskColumnProps {
  status: string;
  tasks: TaskType[];
  moveTask: (taskId: number, toStatus: string) => void;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  openMenuId: number | null;
  onMenuToggle: (taskId: number) => void;
}

const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsModalNewTaskOpen,
  openMenuId,
  onMenuToggle,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: number }) => moveTask(item.id, status),
    collect: (monitor: import("react-dnd").DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const tasksCount = tasks.filter((task) => task.status === status).length;

  const statusColor: Record<string, string> = {
    "To Do": "#2563EB",
    "Work In Progress": "#059669",
    "Under Review": "#D97706",
    Completed: "#000000",
  };

  return (
    <div
      ref={(instance) => {
        drop(instance);
      }}
      className={`sl:py-4 rounded-lg py-2 transition-colors duration-300 ease-in-out xl:px-2 ${isOver ? "bg-blue-100/50 dark:bg-neutral-950" : ""}`}
    >
      <div className="mb-3 flex w-full">
        <div
          className={`w-2 rounded-s-lg`}
          style={{ backgroundColor: statusColor[status] }}
        />
        <div className="dark:bg-dark-secondary flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4">
          <h3 className="flex items-center text-lg font-semibold dark:text-white">
            {status}{" "}
            <span className="dark:bg-dark-tertiary ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 p-1 text-center text-sm leading-none">
              {tasksCount}
            </span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              className="dark:bg-dark-tertiary flex size-6 items-center justify-center rounded bg-gray-200 dark:text-white"
              onClick={() => setIsModalNewTaskOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {tasks
        .filter((task) => task.status === status)
        .map((task) => (
          <Task
            key={task.id}
            task={task}
            openMenuId={openMenuId}
            onMenuToggle={onMenuToggle}
          />
        ))}
    </div>
  );
};

type TaskProps = {
  task: TaskType;
  openMenuId: number | null;
  onMenuToggle: (taskId: number) => void;
};

const Task = ({ task, openMenuId, onMenuToggle }: TaskProps) => {
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false); // <-- State for the edit modal

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor: import("react-dnd").DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // --- Handlers for opening and closing the modal ---
  const handleCardClick = () => {
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onMenuToggle(task.id); // Close the kebab menu
    setEditModalOpen(true); // Open the edit modal
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    onMenuToggle(task.id);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    const promise = deleteTask(task.id).unwrap();
    toast.promise(promise, {
      loading: "Deleting task...",
      success: "Task deleted successfully!",
      error: "Failed to delete task.",
    });
    setConfirmModalOpen(false);
  };

  const taskTagsSplit = task.tags ? task.tags.split(",") : [];
  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "P")
    : "";
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "P")
    : "";
  // Removed unused variable 'numberOfComments'
  const attachmentCount = task.attachments?.length || 0;
  const commentCount = task.comments?.length || 0;

  const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
    <div
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        priority === "Urgent"
          ? "bg-red-200 text-red-700"
          : priority === "High"
            ? "bg-yellow-200 text-yellow-700"
            : priority === "Medium"
              ? "bg-green-200 text-green-700"
              : priority === "Low"
                ? "bg-blue-200 text-blue-700"
                : "bg-gray-200 text-gray-700"
      }`}
    >
      {priority}
    </div>
  );

  return (
    <>
      {/* --- Render Modals --- */}
      {isEditModalOpen && (
        <ModalEditTask taskId={task.id} onClose={handleCloseModal} />
      )}
      <ModalConfirm
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to permanently delete the task: "${task.title}"?`}
        isLoading={isDeleting}
      />
      <div
        ref={(instance) => {
          drag(instance);
        }}
        onClick={handleCardClick} // <-- Open modal on card click
        className={`dark:bg-dark-secondary mb-4 cursor-pointer rounded-md bg-white shadow hover:shadow-xl ${isDragging ? "opacity-50" : "opacity-100"}`}
      >
        {/* ... existing task content ... */}
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {task.priority && <PriorityTag priority={task.priority} />}
              <div className="flex gap-2">
                {taskTagsSplit.map((tag) => (
                  <div
                    key={tag}
                    className="rounded-full bg-blue-100 px-2 py-1 text-xs"
                  >
                    {" "}
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle(task.id);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <MoreVertical size={20} />
              </button>
              {openMenuId === task.id && (
                <div className="dark:bg-dark-tertiary absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg">
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    {/* --- Edit Button --- */}
                    <button
                      onClick={handleEditClick}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                      role="menuitem"
                    >
                      <Edit className="mr-3 h-5 w-5" />
                      <span>Edit</span>
                    </button>
                    {/* --- Delete Button --- */}
                    <button
                      onClick={handleDeleteClick}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-500 dark:hover:bg-gray-600"
                      role="menuitem"
                    >
                      <Trash2 className="mr-3 h-5 w-5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="my-3 flex justify-between">
            <h4 className="text-md font-bold dark:text-white">{task.title}</h4>
            {typeof task.points === "number" && (
              <div className="text-xs font-semibold dark:text-white">
                {task.points} pts
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-neutral-500">
            {formattedStartDate && <span>{formattedStartDate} - </span>}
            {formattedDueDate && <span>{formattedDueDate}</span>}
          </div>
          <p className="text-sm text-gray-600 dark:text-neutral-500">
            {task.description}
          </p>
          <div className="dark:border-stroke-dark mt-4 border-t border-gray-200" />

          {/* Users */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex -space-x-[6px] overflow-hidden">
              {task.assignee && (
                task.assignee.profilePictureUrl ? (
                  <Image
                    key={`assignee-${task.assignee.userId}`}
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${task.assignee.profilePictureUrl}`}
                    alt={task.assignee.username}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full border-2 border-white object-cover dark:border-dark-secondary"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div 
                    key={`assignee-${task.assignee.userId}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-xs font-semibold text-white dark:border-dark-secondary"
                  >
                    {task.assignee.username.slice(0, 2).toUpperCase()}
                  </div>
                )
              )}
              {task.author && (
                task.author.profilePictureUrl ? (
                  <Image
                    key={`author-${task.author.userId}`}
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${task.author.profilePictureUrl}`}
                    alt={task.author.username}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full border-2 border-white object-cover dark:border-dark-secondary"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div
                    key={`author-${task.author.userId}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-purple-500 text-xs font-semibold text-white dark:border-dark-secondary"
                  >
                    {task.author.username.slice(0, 2).toUpperCase()}
                  </div>
                )
              )}
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              {attachmentCount > 0 && (
                <div
                  className="flex items-center gap-1.5"
                  title={`${attachmentCount} attachments`}
                >
                  <Paperclip className="h-4 w-4" />
                  <span>{attachmentCount}</span>
                </div>
              )}
              <div
                className="flex items-center gap-1.5"
                title={`${commentCount} comments`}
              >
                <MessageSquareMore className="h-4 w-4" />
                <span>{commentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BoardView;