"use client";

import { useAppSelector } from '@/app/redux';
import { Gantt, Task as GanttTask, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import ModalEditTask from '@/components/ModalEditTask';
import { Task as TaskType } from '@/state/api';
import ModalViewTask from '@/components/ModalViewTask';

type Props = {
    tasks: TaskType[]; // The active tasks passed from the parent page
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
    searchTerm: string;
    isProjectActive: boolean; // Flag to control read-only state
}

type TaskTypeItems = "task" | "milestone" | "project";

const TimelineView = ({ tasks, setIsModalNewTaskOpen, searchTerm, isProjectActive }: Props) => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  const [displayOptions, setDisplayOptions] = useState({
    viewMode: ViewMode.Month,
    locale: "en-US",
    taskNameWidth: "150px" as "narrow" | "medium" | "wide" | string
  });
  
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const ganttTasks = useMemo(() => {
    if (!tasks) return [];
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const filtered = searchTerm
      ? tasks.filter(task => 
            task.title.toLowerCase().includes(lowercasedSearchTerm) ||
            (task.description && task.description.toLowerCase().includes(lowercasedSearchTerm))
        )
      : tasks;

    // Ensure we only try to render tasks that have both a start and end date.
    return (
      filtered
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
  }, [tasks, searchTerm, isProjectActive]);

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
    </div>
  )
}

export default TimelineView;