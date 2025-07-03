import { useDeleteTaskMutation, useGetTasksQuery, useUpdateTaskStatusMutation } from '@/state/api';
import React, { useState, MouseEvent } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task as TaskType } from '@/state/api';
import { EllipsisVertical, MessageSquareMore, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import BoardViewSkeleton from './BoardViewSkeleton';
import toast from 'react-hot-toast';
import ModalConfirm from '@/components/ModalConfirm';

type BoardProps = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const taskStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

const BoardView = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
  const { 
    data: tasks, 
    isLoading, 
    error,
  } = useGetTasksQuery({ projectId: Number(id) });
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleMenuToggle = (taskId: number) => {
    setOpenMenuId(openMenuId === taskId ? null : taskId);
  };

  const moveTask = (taskId: number, toStatus: string) => {
    updateTaskStatus({ taskId, status: toStatus });
  };

  if (isLoading) return <BoardViewSkeleton />;
  if (error) return <div className="p-6 text-center text-red-500">An error occurred while fetching tasks.</div>;

  return (
    <DndProvider backend={HTML5Backend}>
        <div className='grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4'>
            {taskStatus.map((status) => (
                <TaskColumn
                    key={status}
                    status={status}
                    tasks={tasks || []}
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
        accept: 'task',
        drop: (item: { id: number }) => moveTask(item.id, status),
        collect: (monitor: any) => ({
            isOver: !!monitor.isOver()
        })
    }));

    const tasksCount = tasks.filter((task) => task.status === status).length;

    const statusColor: any = {
        "To Do": "#2563EB",
        "Work In Progress": "#059669",
        "Under Review": "#D97706",
        "Completed": "#000000"
    };

    return (
        <div
            ref={(instance) => {
                drop(instance);
            }}
            className={`sl:py-4 rounded-lg py-2 xl:px-2 transition-colors duration-300 ease-in-out 
                ${isOver ? "bg-blue-100/50 dark:bg-neutral-950" : ""}`}
        >
            <div className='mb-3 flex w-full'>
                <div
                    className={`w-2 rounded-s-lg`}
                    style={{ backgroundColor: statusColor[status] }}
                />
                <div className='flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary'>
                    <h3 className='flex items-center text-lg font-semibold dark:text-white'>
                        {status}{" "}
                        <span 
                            className='ml-2 inline-block flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary'
                        >
                            {tasksCount}
                        </span>
                    </h3>
                    <div className='flex items-center gap-1'>
                        <button 
                            className='flex size-6 items-center justify-center rounded bg-gray-200 dark:bg-dark-tertiary dark:text-white'
                            onClick={() => setIsModalNewTaskOpen(true)}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {tasks.filter((task) => task.status === status).map((task) => (
                <Task key={task.id} task={task} openMenuId={openMenuId} onMenuToggle={onMenuToggle} />
            ))}
        </div>
    );
};

type TaskProps = {
    task: TaskType;
    openMenuId: number | null;
    onMenuToggle: (taskId: number) => void;
}

const Task = ({ task, openMenuId, onMenuToggle }: TaskProps) => {
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'task',
        item: { id: task.id },
        collect: (monitor: any) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const handleDeleteClick = (e: MouseEvent) => {
        e.stopPropagation();
        onMenuToggle(task.id);
        setConfirmModalOpen(true);
    };
    
    const handleConfirmDelete = () => {
        const promise = deleteTask(task.id).unwrap();
        toast.promise(promise, {
            loading: 'Deleting task...',
            success: 'Task deleted successfully!',
            error: 'Failed to delete task.'
        });
        setConfirmModalOpen(false);
    };

    const taskTagsSplit = task.tags ? task.tags.split(",") : [];
    const formattedStartDate = task.startDate ? format(new Date(task.startDate), "P") : "";
    const formattedDueDate = task.dueDate ? format(new Date(task.dueDate), "P") : "";
    const numberOfComments = (task.comments && task.comments.length) || 0;

    const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
        <div
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                priority === "Urgent" ? "bg-red-200 text-red-700" : priority === "High" ?
                "bg-yellow-200 text-yellow-700" : priority === "Medium" ?
                "bg-green-200 text-green-700" : 
                priority === "Low" ? 
                "bg-blue-200 text-blue-700" :
                "bg-gray-200 text-gray-700"
            }`}
        >
            {priority}
        </div>
    );

    return (
        <>
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
                className={`mb-4 rounded-md bg-white shadow dark:bg-dark-secondary hover:shadow-xl`}
            >
                {task.attachments && task.attachments.length > 0 && (
                    <Image
                        src={`/${task.attachments[0].fileURL}`}
                        alt={task.attachments[0].fileName}
                        width={400}
                        height={200}
                        className='h-auto w-full rounded-t-md'
                    />
                )}
                <div className='p-4 md:p-6'>
                    <div className='flex items-start justify-between'>
                        <div className='flex flex-1 flex-wrap items-center gap-2'>
                            {task.priority && <PriorityTag priority={task.priority} />}
                            <div className='flex gap-2'>
                                {taskTagsSplit.map((tag) => (
                                    <div key={tag} className='rounded-full bg-blue-100 px-2 py-1 text-xs'>
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
                                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-dark-tertiary">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                        <button
                                            onClick={handleDeleteClick}
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
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
                    <div className='my-3 flex justify-between'>
                        <h4 className='text-md font-bold dark:text-white'>
                            {task.title}
                        </h4>
                        {typeof task.points === 'number' && (
                            <div className='text-xs font-semibold dark:text-white'>
                                {task.points} pts
                            </div> 
                        )}
                    </div>

                    <div className='text-xs text-gray-500 dark:text-neutral-500'>
                        {formattedStartDate && <span>{formattedStartDate} - </span>}
                        {formattedDueDate && <span>{formattedDueDate}</span>}
                    </div>
                    <p className='text-sm text-gray-600 dark:text-neutral-500'>
                        {task.description}
                    </p>
                    <div className='mt-4 border-t border-gray-200 dark:border-stroke-dark' />

                    {/* Users */}
                    <div className='mt-3 flex items-center justify-between'>
                        <div className='flex -space-x-[6px] overflow-hidden'>
                            {task.assignee && (
                                <Image
                                    key={task.assignee.userId}
                                    src={`/${task.assignee.profilePictureUrl!}`}
                                    alt={task.assignee.username}
                                    width={30}
                                    height={30}
                                    className='h-8 w-8 rounded-full border-2 border-white object-cover dark:border-dark-secondary'
                                />
                            )}
                            {task.author && (
                                <Image
                                    key={task.author.userId}
                                    src={`/${task.author.profilePictureUrl!}`}
                                    alt={task.author.username}
                                    width={30}
                                    height={30}
                                    className='h-8 w-8 rounded-full border-2 border-white object-cover dark:border-dark-secondary'
                                />
                            )}
                        </div>
                        <div className='flex items-center text-gray-500 dark:text-neutral-500'>
                            <MessageSquareMore size={20} />
                            <span className='ml-1 text-sm dark:text-neutral-400'>
                                {numberOfComments}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BoardView;