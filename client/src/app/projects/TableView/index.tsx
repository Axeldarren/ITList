import { useAppSelector } from '@/app/redux';
import Header from '@/components/Header';
import { dataGridSxStyles } from '@/lib/utils';
import { useGetTasksQuery } from '@/state/api';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';

type Props = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  searchTerm: string; // New prop for search
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

const TableView = ({ id, setIsModalNewTaskOpen, searchTerm }: Props) => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const {
    data: tasks,
    error,
    isLoading,
  } = useGetTasksQuery({ projectId: Number(id) });

  // Filter tasks based on the search term
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

  if (isLoading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Tasks...</div>;
  if (error || !tasks) return <div className="p-6 text-center text-red-500">An error occurred while fetching tasks.</div>;

  return (
    <div className='h-[540px] w-full px-4 pb-8 xl:px-6'>
        <div className='pt-5'>
            <Header
                name="Table"
                buttonComponent={
                    <button
                        className="flex items-center rounded bg-blue-primary px-3 py-2 text-white hover:bg-blue-600"
                        onClick={() => setIsModalNewTaskOpen(true)}
                    >
                        <Plus size={18} />
                        Add Task
                    </button>
                }
                isSmallText
            />
        </div>
        <DataGrid
            rows={filteredTasks || []}
            columns={columns}
            sx={dataGridSxStyles(isDarkMode)}
        />
    </div>
  )
}

export default TableView;