"use client";

import React, { useState } from 'react';
import { useGetDeveloperStatsPaginatedQuery, useGetUsersQuery, useGetTimeLogsQuery, useGetAllRunningTimeLogsQuery } from '@/state/api';

import { FileDown, Clock, CheckCircle, AlertTriangle, Target, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportProductivityToPDF } from '@/lib/productivityReportGenerator';
import { format } from 'date-fns';
import Image from 'next/image';
import ModalViewTimeLogs from '@/components/ModalViewTimeLogs';
import ModalViewCompletedTasks from '@/components/ModalViewCompletedTasks';
import MonthPicker from '@/components/MonthPicker';
import LiveTimerDisplay from '@/components/LiveTimerDisplay';

const DEVELOPERS_PER_PAGE = 10;

const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 0) return '0:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    // Pad minutes and seconds with leading zeros
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${h}:${pad(m)}:${pad(s)}`;
};

const DeveloperProductivity = () => {
    // Fetch all running time logs (for all users)
    const { data: runningTimeLogs = [] } = useGetAllRunningTimeLogsQuery();
    // Helper: Map userId to their running time log (if any)
    const runningLogByUserId = new Map<string, import('@/state/api').TimeLog>();
    runningTimeLogs.forEach((log: import('@/state/api').TimeLog) => {
        if (log.userId) runningLogByUserId.set(log.userId, log);
    });
    // State for the month range filter
    const [startMonth, setStartMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [endMonth, setEndMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modal states
    const [timeLogsModal, setTimeLogsModal] = useState<{ isOpen: boolean; developer: { userId: string; username: string; profilePictureUrl?: string; isAdmin?: boolean } } | null>(null);
    const [completedTasksModal, setCompletedTasksModal] = useState<{ isOpen: boolean; developer: { userId: string; username: string; profilePictureUrl?: string; isAdmin?: boolean } } | null>(null);

    const { data: statsResponse, isLoading } = useGetDeveloperStatsPaginatedQuery({ 
        startMonth,
        endMonth,
        page: currentPage,
        limit: DEVELOPERS_PER_PAGE
    });
    
    const stats = statsResponse?.data ?? [];
    const meta = statsResponse?.meta;
    
    const { data: users = [] } = useGetUsersQuery();
    
    // Get today's time logs to calculate today's time for each developer
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: todayTimeLogs = [] } = useGetTimeLogsQuery({ 
        month: format(new Date(), 'yyyy-MM') 
    });

    // Helper function to calculate today's time logged for a specific user
    const getTodayTimeLogged = (userId: string): number => {
        const userTodayLogs = todayTimeLogs.filter(log => {
            if (!log.startTime || !log.endTime || log.userId !== userId) return false;
            const logDate = format(new Date(log.startTime), 'yyyy-MM-dd');
            return logDate === today;
        });
        
        return userTodayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    };

    const handleExport = () => {
        exportProductivityToPDF(sortedStats, getDateRangeLabel());
    };

    const getUserProfile = (userId: string) => {
        return users.find(user => user.userId === userId);
    };

    const getDateRangeLabel = () => {
        const startDate = format(new Date(`${startMonth}-01`), 'MMMM yyyy');
        const endDate = format(new Date(`${endMonth}-01`), 'MMMM yyyy');
        
        if (startMonth === endMonth) {
            return startDate;
        }
        return `${startDate} to ${endDate}`;
    };

    // Ensure endMonth is not earlier than startMonth
    const handleEndMonthChange = (newEndMonth: string) => {
        if (newEndMonth < startMonth) {
            setStartMonth(newEndMonth);
        }
        setEndMonth(newEndMonth);
        setCurrentPage(1); // Reset to first page on date change
    };

    const handleStartMonthChange = (newStartMonth: string) => {
        if (newStartMonth > endMonth) {
            setEndMonth(newStartMonth);
        }
        setStartMonth(newStartMonth);
        setCurrentPage(1); // Reset to first page on date change
    };

    const handleTimeLogsClick = (dev: { userId: string; username: string; isAdmin?: boolean }) => {
        const userProfile = getUserProfile(dev.userId);
        setTimeLogsModal({
            isOpen: true,
            developer: {
                userId: dev.userId,
                username: dev.username,
                profilePictureUrl: userProfile?.profilePictureUrl,
                isAdmin: dev.isAdmin
            }
        });
    };

    const handleCompletedTasksClick = (dev: { userId: string; username: string; isAdmin?: boolean }) => {
        const userProfile = getUserProfile(dev.userId);
        setCompletedTasksModal({
            isOpen: true,
            developer: {
                userId: dev.userId,
                username: dev.username,
                profilePictureUrl: userProfile?.profilePictureUrl,
                isAdmin: dev.isAdmin
            }
        });
    };

    const dateRangeLabel = getDateRangeLabel();

    // Sort developers: those with a running time log at the very top, then by previous logic
    const sortedStats = [...stats].sort((a, b) => {
        const aHasRunning = runningLogByUserId.has(a.userId);
        const bHasRunning = runningLogByUserId.has(b.userId);
        if (aHasRunning && !bHasRunning) return -1;
        if (!aHasRunning && bHasRunning) return 1;
        // Fallback to previous logic
        if (a.totalTimeLogged > 0 && b.totalTimeLogged === 0) return -1;
        if (a.totalTimeLogged === 0 && b.totalTimeLogged > 0) return 1;
        if (a.totalTimeLogged > 0 && b.totalTimeLogged > 0) {
            return b.totalTimeLogged - a.totalTimeLogged;
        }
        if (a.totalTimeLogged === 0 && b.totalTimeLogged === 0) {
            return b.completedTasks - a.completedTasks;
        }
        return 0;
    });

    // Calculate overall totals for summary
    const totalTimeLogged = sortedStats.reduce((sum, dev) => sum + dev.totalTimeLogged, 0);
    const totalCompletedTasks = sortedStats.reduce((sum, dev) => sum + dev.completedTasks, 0);

    return (
        <div className="p-6 bg-white rounded-lg shadow dark:bg-dark-secondary">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Developer Productivity</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Time logged and tasks completed for {dateRangeLabel}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
                        <MonthPicker
                            value={startMonth}
                            onChange={handleStartMonthChange}
                            placeholder="Start Month"
                            className="min-w-[180px]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
                        <MonthPicker
                            value={endMonth}
                            onChange={handleEndMonthChange}
                            placeholder="End Month"
                            className="min-w-[180px]"
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        disabled={isLoading || sortedStats.length === 0}
                        className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                    >
                        <FileDown size={18} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Summary Section */}
            {!isLoading && sortedStats.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-blue-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target size={20} className="text-blue-500" />
                        {dateRangeLabel} Summary
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
            ) : sortedStats.length === 0 ? (
                <div className="text-center py-12">
                    <Target size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No productivity data found for {dateRangeLabel}
                    </p>
                </div>
            ) : (
            <>
                <div className="grid gap-4">
                    {sortedStats.map((dev) => {
                        const userProfile = getUserProfile(dev.userId);
                        
                        // Show running task/timer if present
                        const runningLog = runningLogByUserId.get(dev.userId);
                        return (
                            <div key={dev.userId} className={`rounded-lg p-4 border ${
                                dev.totalTimeLogged > 0 
                                    ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700' 
                                    : 'bg-gray-50 dark:bg-dark-tertiary border-gray-200 dark:border-gray-600'
                            }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
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
                                            {dev.totalTimeLogged > 0 && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dev.username}</h3>
                                                {dev.isAdmin && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {dev.completedTasks} tasks completed
                                            </p>
                                            {runningLog && (
                                                <LiveTimerDisplay runningLog={runningLog} />
                                            )}

                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-gray-400" />
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatDuration(dev.totalTimeLogged)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Time Logged - First Priority */}
                                    <div 
                                        onClick={() => handleTimeLogsClick(dev)}
                                        className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-purple-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Logged</span>
                                        </div>
                                        <p className="text-xl font-bold text-purple-600 mt-1">
                                            {formatDuration(dev.totalTimeLogged)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                                    </div>

                                    {/* Today's Time Logged */}
                                    <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-orange-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Today&apos;s Time</span>
                                        </div>
                                        <p className="text-xl font-bold text-orange-600 mt-1">
                                            {formatDuration(getTodayTimeLogged(dev.userId))}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Today only</p>
                                    </div>

                                    {/* Completed Tasks */}
                                    <div 
                                        onClick={() => handleCompletedTasksClick(dev)}
                                        className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Completed</span>
                                        </div>
                                        <p className="text-xl font-bold text-green-600 mt-1">
                                            {dev.completedTasks}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Click to view tasks</p>
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

                {/* Pagination Controls */}
                {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {(currentPage - 1) * DEVELOPERS_PER_PAGE + 1}-{Math.min(currentPage * DEVELOPERS_PER_PAGE, meta.total)} of {meta.total} developers
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                                Page {currentPage} of {meta.totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={currentPage === meta.totalPages}
                                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </>
            )}

            {/* Modals */}
            {timeLogsModal && (
                <ModalViewTimeLogs
                    isOpen={timeLogsModal.isOpen}
                    onClose={() => setTimeLogsModal(null)}
                    developer={timeLogsModal.developer}
                    selectedMonth={endMonth}
                />
            )}

            {completedTasksModal && (
                <ModalViewCompletedTasks
                    isOpen={completedTasksModal.isOpen}
                    onClose={() => setCompletedTasksModal(null)}
                    developer={completedTasksModal.developer}
                    selectedMonth={endMonth}
                />
            )}
        </div>
    );
};

export default DeveloperProductivity;