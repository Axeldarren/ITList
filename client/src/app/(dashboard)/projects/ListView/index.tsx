"use client";

import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { Task, useGetTasksQuery } from '@/state/api';
import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'; 

type Props = {
    projectId: number;
    version: number;
    tasks?: Task[]; // Made optional as we fetch internally
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
    searchTerm: string; 
    isProjectActive: boolean;
}

const ListView = ({ projectId, version, setIsModalNewTaskOpen, searchTerm, isProjectActive }: Props) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useGetTasksQuery({ 
      projectId: Number(projectId), 
      version: Number(version),
      page,
      limit,
      search: searchTerm
  });

  const tasks = (data && 'data' in data) ? data.data : (Array.isArray(data) ? data : []);
  const meta = (data && 'meta' in data) ? data.meta : null;

  const handleMenuToggle = (taskId: number) => {
    setOpenMenuId(openMenuId === taskId ? null : taskId);
  };
  
  const handleNextPage = () => {
    if (meta && page < meta.totalPages) {
        setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
        setPage(page - 1);
    }
  };

  if (isLoading) return <div className="p-4">Loading tasks...</div>;

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

          <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6'>
              {tasks?.length > 0 ? (
                  tasks.map((task: Task) => (
                      <TaskCard 
                          key={task.id} 
                          task={task}
                          openMenuId={openMenuId}
                          onMenuToggle={handleMenuToggle}
                          isProjectActive={isProjectActive}
                      />
                  ))
              ) : (
                  <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No tasks match your search.' : 'No tasks in this project yet.'}
                  </p>
              )}
          </div>

          {/* Pagination Controls */}
          {meta && (
             <div className="flex justify-center items-center gap-4 mt-8">
                <button
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Page {page} of {meta.totalPages || 1}
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={page >= (meta.totalPages || 1)}
                    className="flex items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Next <ChevronRight size={16} />
                </button>
             </div>
          )}
      </div>
  );
}

export default ListView;