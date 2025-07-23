"use client";

import { useAppSelector } from '@/app/redux';
import Header from '@/components/Header';
import { dataGridSxStyles } from '@/lib/utils';
import { Task } from '@/state/api'; // Import the Task type
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';

type Props = {
  tasks: Task[]; // --- UPDATED: Receive tasks as a prop ---
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  searchTerm: string; 
  isProjectActive: boolean; // NEW: Prop to check if the project is active
};

const columns: GridColDef[] = [
  {
    field: "title",
    headerName: "Title",
    width: 100,
  },
  {
    field: "description",
    headerName: "Description",
    width: 200,
  },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (params) => (
      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
        {params.value}
      </span>
    ),
  },
  {
    field: "priority",
    headerName: "Priority",
    width: 75,
  },
  {
    field: "tags",
    headerName: "Tags",
    width: 130,
  },
  {
    field: "startDate",
    headerName: "Start Date",
    width: 130,
  },
  {
    field: "dueDate",
    headerName: "Due Date",
    width: 130,
  },
  {
    field: "author",
    headerName: "Author",
    width: 150,
    renderCell: (params) => params.value?.username || "Unknown",
  },
  {
    field: "assignee",
    headerName: "Assignee",
    width: 150,
    renderCell: (params) => params.value?.username || "Unassigned",
  },
];

const TableView = ({ tasks, setIsModalNewTaskOpen, searchTerm, isProjectActive }: Props) => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // The component no longer fetches data. It just filters the props.
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

  return (
    <div className='h-[540px] w-full px-4 pb-8 xl:px-6'>
        <div className='pt-5'>
            <Header
                name="Table"
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
                isSmallText
            />
        </div>
        <DataGrid
            rows={filteredTasks || []}
            columns={columns}
            sx={dataGridSxStyles(isDarkMode)}
            // Show a message if no rows are available after filtering
            localeText={{ noRowsLabel: searchTerm ? 'No tasks match your search' : 'No tasks to display' }}
        />
    </div>
  )
}

export default TableView;