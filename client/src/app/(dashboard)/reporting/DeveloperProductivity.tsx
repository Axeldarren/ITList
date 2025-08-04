"use client";

import React, { useState } from 'react';
import { useGetDeveloperStatsQuery, useGetUsersQuery } from '@/state/api';
import { FileDown, Clock, CheckCircle, AlertTriangle, Target, User } from 'lucide-react';
import { exportProductivityToPDF } from '@/lib/productivityReportGenerator';
import { format } from 'date-fns';
import Image from 'next/image';

const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 60) return `0m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return [ h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '' ].filter(Boolean).join(' ');
};

const DeveloperProductivity = () => {
    // State for the month filter
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    const { data: stats = [], isLoading } = useGetDeveloperStatsQuery({ 
        month: selectedMonth 
    });
    const { data: users = [] } = useGetUsersQuery();

    const handleExport = () => {
        exportProductivityToPDF(stats, selectedMonth);
    };

    const getUserProfile = (userId: number) => {
        return users.find(user => user.userId === userId);
    };

    const monthName = format(new Date(`${selectedMonth}-01`), 'MMMM yyyy');

    // Calculate overall totals for summary
    const totalTimeLogged = stats.reduce((sum, dev) => sum + dev.totalTimeLogged, 0);
    const totalCompletedTasks = stats.reduce((sum, dev) => sum + dev.completedTasks, 0);

    return (
        <div className="p-6 bg-white rounded-lg shadow dark:bg-dark-secondary">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Developer Productivity</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Time logged and tasks completed for {monthName}</p>
                </div>
                <div className="flex items-center gap-4">
                    <input 
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="rounded border p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white"
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

            {/* Summary Section */}
            {!isLoading && stats.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-blue-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target size={20} className="text-blue-500" />
                        {monthName} Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-dark-bg p-4 rounded-lg border border-blue-100 dark:border-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} className="text-purple-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time Logged</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{formatDuration(totalTimeLogged)}</p>
                        </div>
                        <div className="bg-white dark:bg-dark-bg p-4 rounded-lg border border-blue-100 dark:border-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle size={16} className="text-green-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks Completed</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{totalCompletedTasks}</p>
                        </div>
                        <div className="bg-white dark:bg-dark-bg p-4 rounded-lg border border-blue-100 dark:border-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                                <User size={16} className="text-blue-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Developers</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{stats.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Loading productivity data...</p>
                </div>
            ) : stats.length === 0 ? (
                <div className="text-center py-12">
                    <Target size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No productivity data found for {monthName}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {stats.map((dev) => {
                        const userProfile = getUserProfile(dev.userId);
                        
                        return (
                            <div key={dev.userId} className="bg-gray-50 dark:bg-dark-tertiary rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {userProfile?.profilePictureUrl ? (
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${userProfile.profilePictureUrl}`}
                                                alt={dev.username}
                                                width={48}
                                                height={48}
                                                className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg">
                                                {dev.username ? dev.username.substring(0, 2).toUpperCase() : <User size={24} className="text-gray-600 dark:text-gray-300" />}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dev.username}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {dev.completedTasks} tasks completed
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-gray-400" />
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatDuration(dev.totalTimeLogged)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Time Logged - First Priority */}
                                    <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-purple-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Logged</span>
                                        </div>
                                        <p className="text-xl font-bold text-purple-600 mt-1">
                                            {formatDuration(dev.totalTimeLogged)}
                                        </p>
                                    </div>

                                    {/* Completed Tasks */}
                                    <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Completed</span>
                                        </div>
                                        <p className="text-xl font-bold text-green-600 mt-1">
                                            {dev.completedTasks}
                                        </p>
                                    </div>

                                    {/* Overdue Tasks */}
                                    <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={16} className="text-red-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</span>
                                        </div>
                                        <p className="text-xl font-bold text-red-600 mt-1">
                                            {dev.overdueTasks}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DeveloperProductivity;