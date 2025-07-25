"use client";

import React, { useState } from 'react';
import { useGetDeveloperStatsQuery } from '@/state/api';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAppSelector } from '@/app/redux';
import { dataGridSxStyles } from '@/lib/utils';
import { FileDown } from 'lucide-react';
import { exportProductivityToPDF } from '@/lib/productivityReportGenerator';
import { format } from 'date-fns';

const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 60) return `0m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return [ h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '' ].filter(Boolean).join(' ');
};

const columns: GridColDef[] = [
    { field: 'username', headerName: 'Developer', width: 200 },
    { field: 'totalTasks', headerName: 'Total Tasks (Month)', type: 'number', width: 150 },
    { field: 'completedTasks', headerName: 'Completed (Month)', type: 'number', width: 150 },
    { field: 'overdueTasks', headerName: 'Overdue (Active)', type: 'number', width: 150, cellClassName: (params) => params.value > 0 ? 'text-red-500 font-bold' : '' },
    { 
        field: 'totalTimeLogged', 
        headerName: 'Time Logged (Month)', 
        width: 180,
        valueFormatter: (value: number) => formatDuration(value),
    },
];

const DeveloperProductivity = () => {
    // --- NEW: State for the month filter ---
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    const { data: stats = [], isLoading } = useGetDeveloperStatsQuery({ 
        month: selectedMonth 
    });
    const isDarkMode = useAppSelector(state => state.global.isDarkMode);

    const handleExport = () => {
        exportProductivityToPDF(stats, selectedMonth);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow dark:bg-dark-secondary">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Developer Productivity</h2>
                <div className="flex items-center gap-4">
                    {/* --- NEW: Month Input --- */}
                    <input 
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full rounded border p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white"
                    />
                    <button 
                        onClick={handleExport}
                        disabled={isLoading || stats.length === 0}
                        className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                    >
                        <FileDown size={18} /> Export PDF
                    </button>
                </div>
            </div>
            <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={stats}
                    columns={columns}
                    getRowId={(row) => row.userId}
                    loading={isLoading}
                    sx={dataGridSxStyles(isDarkMode)}
                />
            </div>
        </div>
    );
};

export default DeveloperProductivity;