"use client";

import { useAppSelector } from '@/app/redux';
import { Gantt, Task as GanttTask, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import ModalEditTask from '@/components/ModalEditTask';
import { useGetTasksQuery, Task as TaskType } from '@/state/api';
import ModalViewTask from '@/components/ModalViewTask';

type Props = {
    projectId: number;
    version: number;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
    searchTerm: string;
    isProjectActive: boolean; // Flag to control read-only state
}

type TaskTypeItems = "task" | "milestone" | "project";

const TimelineView = ({ projectId, version, setIsModalNewTaskOpen, searchTerm, isProjectActive }: Props) => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  const [displayOptions, setDisplayOptions] = useState({
    viewMode: ViewMode.Month,
    locale: "en-US",
    taskNameWidth: "150px" as "narrow" | "medium" | "wide" | string
  });
  
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: qData, isLoading } = useGetTasksQuery({ 
      projectId, 
      version,
      page,
      limit,
      search: searchTerm
  });

  const tasks = (qData && 'data' in qData) ? qData.data : (Array.isArray(qData) ? qData : []);
  const meta = (qData && 'meta' in qData) ? qData.meta : null;

  const ganttTasks = useMemo(() => {
    if (!tasks) return [];
    
    // Server-side filtering handles the search now, but we perform client-side mapping
    // We double check title/description just in case fallback to array response (though controller updated)
    // Actually, if server filtered, we just map. 
    // Wait, if fallback array response (all tasks), we might need client filtering?
    // Controller logic: IF page&limit, it returns data/meta and ALREADY filters by search.
    // If not page&limit, it returns array. 
    // Here we ALWAYS pass page&limit. So it is filtered.
    // However, robust code can handle it.
    
    // Ensure we only try to render tasks that have both a start and end date.
    return (
      tasks
        .filter(task => task.startDate && task.dueDate) 
        .map((task) => ({
            start: new Date(task.startDate!),
            end: new Date(task.dueDate!),
            name: task.title,
            id: `${task.id}`,
            type: "task" as TaskTypeItems,
            progress: task.status === 'Completed' ? 100 : 50,
            isDisabled: !isProjectActive, // Disable interactions if the project is finished/canceled
      }))
    )
  }, [tasks, isProjectActive]); // Removed searchTerm from dependency as data is already filtered

  const handleTaskClick = (task: GanttTask) => {
    setSelectedTaskId(Number(task.id));
  };

  const handleCloseModal = () => {
    setSelectedTaskId(null);
  };

  const handleViewModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDisplayOptions((prev) => ({
      ...prev,
      viewMode: event.target.value as ViewMode,
    }));
  };

  const handleTaskNameWidthChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const widthMap = {
      narrow: "150px",
      medium: "280px", 
      wide: "360px"
    };
    setDisplayOptions((prev) => ({
      ...prev,
      taskNameWidth: widthMap[event.target.value as keyof typeof widthMap] || "150px",
    }));
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

  if (isLoading) return <div className="p-4">Loading timeline...</div>;

  return (
    <div className='px-4 xl:px-6 py-6'>
      {/* This logic correctly opens the right modal based on project status */}
      {selectedTaskId && isProjectActive && (
        <ModalEditTask taskId={selectedTaskId} onClose={handleCloseModal} />
      )}
      {selectedTaskId && !isProjectActive && (
        <ModalViewTask taskId={selectedTaskId} onClose={handleCloseModal} />
      )}

      <div className='flex flex-wrap items-center justify-between gap-4 mb-4'>
        <h1 className='me-2 text-lg font-bold dark:text-white'>
          Project Tasks Timeline
        </h1>
        <div className='flex flex-wrap items-center gap-3'>
          {/* View Mode Selector */}
          <div className='relative inline-block'>
            <label className='text-xs text-gray-600 dark:text-gray-300 block mb-1'>View</label>
            <select
              className="focus:shadow-outline block w-32 appearance-none rounded border border-gray-400 bg-white px-3 py-1.5 text-sm leading-tight shadow hover:border-gray-500 focus:outline-none dark:border-dark-secondary dark:bg-dark-secondary dark:text-white"
              value={displayOptions.viewMode}
              onChange={handleViewModeChange}
            >
              <option value={ViewMode.Day}>Day</option>
              <option value={ViewMode.Week}>Week</option>
              <option value={ViewMode.Month}>Month</option>
            </select>
          </div>

          {/* Task Name Width Selector */}
          <div className='relative inline-block'>
            <label className='text-xs text-gray-600 dark:text-gray-300 block mb-1'>Name Width</label>
            <select
              className="focus:shadow-outline block w-32 appearance-none rounded border border-gray-400 bg-white px-3 py-1.5 text-sm leading-tight shadow hover:border-gray-500 focus:outline-none dark:border-dark-secondary dark:bg-dark-secondary dark:text-white"
              value={displayOptions.taskNameWidth === "150px" ? "narrow" : displayOptions.taskNameWidth === "280px" ? "medium" : "wide"}
              onChange={handleTaskNameWidthChange}
            >
              <option value="narrow">Narrow</option>
              <option value="medium">Medium</option>
              <option value="wide">Wide</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
        <div className='timeline'>
          {ganttTasks.length > 0 ? (
            <Gantt
                tasks={ganttTasks}
                {...displayOptions}
                onClick={handleTaskClick}
                columnWidth={displayOptions.viewMode === ViewMode.Month ? 150 : 100}
                listCellWidth={displayOptions.taskNameWidth}
                projectProgressColor={isDarkMode ? "#1f2937" : "#aeb8c2"}
                projectProgressSelectedColor={isDarkMode ? "#000" : "#9ba1a6"}
            />
          ) : (
            <div className="flex h-48 items-center justify-center p-6">
                <h1 className="font-bold text-gray-500 dark:text-white">
                    {searchTerm ? 'No tasks match your search.' : 'No tasks with dates to display in timeline.'}
                </h1>
            </div>
          )}
        </div>
        
        {/* Only show "Add Task" button if the project is active */}
        {isProjectActive && (
          <div className="px-4 pb-5 pt-3">
            <button
              className="flex items-center gap-2 rounded-md bg-[#0275ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              onClick={() => setIsModalNewTaskOpen(true)}
            >
              <Plus size={18} />
              Add Task
            </button>
          </div>
        )}
      </div>

       {/* Pagination Controls */}
       {meta && (
          <div className="flex justify-center items-center gap-4 py-4 border-t border-gray-100 dark:border-gray-700">
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
  )
}

export default TimelineView;