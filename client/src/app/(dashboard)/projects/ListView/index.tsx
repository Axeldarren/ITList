"use client";

import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { Task } from '@/state/api';
import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react'; 

type Props = {
    tasks: Task[]; // It now expects a 'tasks' array as a prop
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
    searchTerm: string; 
    isProjectActive: boolean; // NEW: Prop to check if the project is active
}

const ListView = ({ tasks, setIsModalNewTaskOpen, searchTerm, isProjectActive }: Props) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // The component no longer fetches its own data. It just filters the props.
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!searchTerm) return tasks;

    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return tasks.filter(task => 
        task.title.toLowerCase().includes(lowercasedSearchTerm) ||
        (task.description && task.description.toLowerCase().includes(lowercasedSearchTerm)) ||
        (task.tags && task.tags.toLowerCase().includes(lowercasedSearchTerm)) ||
        (task.priority && task.priority.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [tasks, searchTerm]);

  const handleMenuToggle = (taskId: number) => {
    setOpenMenuId(openMenuId === taskId ? null : taskId);
  };
  
  return (
      <div className='px-4 pb-8 xl:px-6'>
          <div className='pt-5'>
              <Header 
                  name='List'
                  buttonComponent={
                      isProjectActive && (
                                <div className="px-4 pb-5 pt-3">
                                  <button
                                    className="flex items-center gap-2 rounded-md bg-[#0275ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    onClick={() => setIsModalNewTaskOpen(true)}
                                  >
                                    <Plus size={18} />
                                    Add Task
                                  </button>
                                </div>
                      )
                  }
              />
          </div>

          <div className='mt-4 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6'>
              {filteredTasks?.length > 0 ? (
                  filteredTasks.map((task: Task) => (
                      <TaskCard 
                          key={task.id} 
                          task={task}
                          openMenuId={openMenuId}
                          onMenuToggle={handleMenuToggle}
                          isProjectActive={isProjectActive} // Pass the new prop
                      />
                  ))
              ) : (
                  <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No tasks match your search.' : 'No tasks in this project yet.'}
                  </p>
              )}
          </div>
      </div>
  );
}

export default ListView;