"use client"

import { useAppSelector } from '@/app/redux';
import Header from '@/components/Header';
import { useGetProjectsQuery } from '@/state/api';
import { DisplayOption, Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import React, { useMemo, useState } from 'react'

type TaskTypeItems = "task" | "milestone" | "project";

const Timeline = () => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { data: projects, isLoading, isError } = useGetProjectsQuery();

  const [displayOptions, setDisplayOptions] = useState<DisplayOption>({
    viewMode: ViewMode.Month,
    locale: "en-US"
  })
  
  const ganttTasks = useMemo(() => {
    return (
      projects?.map((project) => ({
        start: new Date(project.startDate as string),
        end: new Date(project.endDate as string),
        name: project.name,
        id: `Project-${project.id}`,
        type: "project" as TaskTypeItems,
        progress: 50,
        isDisabled: false
      })) || []
    )
  }, [projects]);

  const handleViewModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDisplayOptions((prev) => ({
      ...prev,
      viewMode: event.target.value as ViewMode,
    }));
  };

  if (isLoading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Timeline...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">An error occurred while fetching projects timeline.</div>;

  return (
    <div className='max-w-full p-8'>
      <header className='mb-2 flex items-center justify-between'>
        <Header name='Projects Timeline' />
        <div className='relative inline-block w-64'>
          <select
            className="focus:shadow-outline block w-full appearance-none rounded border border-gray-400 bg-white px-4 py-2 pr-8 leading-tight shadow hover:border-gray-500 focus:outline-none dark:border-dark-secondary dark:bg-dark-secondary dark:text-white"
            value={displayOptions.viewMode}
            onChange={handleViewModeChange}
          >
            <option value={ViewMode.Day}>Day</option>
            <option value={ViewMode.Week}>Week</option>
            <option value={ViewMode.Month}>Month</option>
          </select>
        </div>
      </header>

      <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
        <div className='timeline'>
          {ganttTasks.length > 0 ? (
            <Gantt
                tasks={ganttTasks}
                {...displayOptions}
                columnWidth={displayOptions.viewMode === ViewMode.Month ? 150 : 100}
                listCellWidth="100px"
                projectProgressColor={isDarkMode ? "#1f2937" : "#aeb8c2"}
                projectProgressSelectedColor={isDarkMode ? "#000" : "#9ba1a6"}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
                <h1 className="mt-6 mb-4 font-bold justify-center text-gray-500 dark:text-white">No tasks to display in the timeline.</h1>
            </div>
          )}
        </div>
        <div className="px-4 pb-5 pt-1">
        </div>
      </div>
    </div>
  )
}

export default Timeline