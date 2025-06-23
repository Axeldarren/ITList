"use client";

import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { Task, useGetTasksQuery } from '@/state/api';
import React from 'react';
import { Plus } from 'lucide-react'; // Import the Plus icon

type Props = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
}

const ListView = ({ id, setIsModalNewTaskOpen }: Props) => {
  const { 
    data: tasks, 
    error, 
    isLoading 
  } = useGetTasksQuery({ projectId: Number(id) });
  
  if (isLoading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Tasks...</div>;
  if (error) return <div className="p-6 text-center text-red-500">An error occurred while fetching tasks.</div>;

    return (
        // This container will inherit the dark background from your main layout (dark:bg-dark-bg)
        <div className='px-4 pb-8 xl:px-6'>
            <div className='pt-5'>
                <Header 
                    name='List'
                    buttonComponent={
                        <button
                            // Using the blue color from your theme for the primary action button
                            className="flex items-center gap-2 rounded-md bg-[#0275ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            onClick={() => setIsModalNewTaskOpen(true)}
                        >
                            <Plus size={18} />
                            Add Task
                        </button>
                    }
                />
            </div>

            {/* Grid for Task Cards */}
            <div className='mt-4 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6'>
                {tasks?.map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
}

export default ListView;