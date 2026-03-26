"use client";

import React, { useState, useMemo } from 'react';
import { useGetProjectsQuery, useGetAllTasksQuery, useGetDeveloperStatsQuery, Status } from '@/state/api';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Briefcase, ListTodo, CheckCircle2, TrendingUp, Clock, Filter } from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#6b7280'];

const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 0) return '0h';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
};

const Overview = () => {
    const { data: projects = [], isLoading: pLoading } = useGetProjectsQuery();
    const { data: tasks = [], isLoading: tLoading } = useGetAllTasksQuery();
    
    const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
    
    // For Developer Stats, we need a start/end month (we can use the current month as default, or fetch all by not providing them if the API supports it. Wait, the API might require them if we want a specific range. Assuming no range gives all time, or we pass current month).
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data: developerStats = [], isLoading: dLoading } = useGetDeveloperStatsQuery({
        startMonth: '2020-01', // Fetch a wide range to get "Total" time logs, or better to use the default empty if endpoint supports it
        endMonth: currentMonth,
        projectId: selectedProjectId
    });

    const isLoading = pLoading || tLoading || dLoading;

    // Derived Metrics
    const activeProjects = projects.filter(p => !p.deletedAt);
    const totalProjects = activeProjects.length;
    const activeTasks = tasks.filter(t => t.status !== Status.Completed).length;
    const completedTasks = tasks.filter(t => t.status === Status.Completed).length;

    // Task Status Distribution
    const taskStatusData = useMemo(() => {
        const counts: Record<string, number> = {};
        tasks.forEach(t => {
            if (t.status) {
                counts[t.status] = (counts[t.status] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    // Developer Time Logs Chart Data
    const devTimeData = useMemo(() => {
        return developerStats
            .map(dev => ({
                name: dev.username || 'Unknown',
                hours: Number((dev.totalTimeLogged / 3600).toFixed(1)),
                completed: dev.completedTasks
            }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 10); // Top 10 devs
    }, [developerStats]);

    // Project Progress Data
    const projectProgressData = useMemo(() => {
        return activeProjects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const total = projectTasks.length;
            const completed = projectTasks.filter(t => t.status === Status.Completed).length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
                id: project.id,
                name: project.name,
                progress,
                total,
                completed
            };
        }).sort((a, b) => b.progress - a.progress).slice(0, 5); // Top 5 ongoing projects
    }, [activeProjects, tasks]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white/60 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                            <Briefcase size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projects</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isLoading ? '-' : totalProjects}
                    </p>
                </div>
                
                <div className="rounded-2xl border border-gray-100 bg-white/60 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                            <ListTodo size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Tasks</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isLoading ? '-' : activeTasks}
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white/60 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isLoading ? '-' : completedTasks}
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white/60 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isLoading ? '-' : (completedTasks + activeTasks > 0 ? Math.round((completedTasks / (completedTasks + activeTasks)) * 100) : 0)}%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Status Distribution */}
                <div className="col-span-1 rounded-2xl border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60 group">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Task Status Distribution</h3>
                    <div className="h-[280px] w-full items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1f2937' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Developer Time Logs Chart */}
                <div className="col-span-1 lg:col-span-2 rounded-2xl border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Clock className="text-blue-500" size={20} />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Developer Time Logs</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={selectedProjectId ?? ''}
                                onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                className="rounded-xl border border-gray-200 bg-white/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-dark-bg/50 dark:text-gray-200 transition-colors"
                            >
                                <option value="">All Projects</option>
                                {activeProjects.map((project) => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="h-[260px] w-full">
                        {devTimeData.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400 italic">No time logs found for the selected filter.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={devTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#6b7280', fontSize: 12 }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                                    />
                                    <Bar dataKey="hours" name="Time Logged (Hours)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Project Completion Progress */}
            <div className="rounded-2xl border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60">
                <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Project Completion Progress</h3>
                <div className="space-y-5">
                    {projectProgressData.length === 0 ? (
                        <p className="text-sm italic text-gray-400">No active projects to track.</p>
                    ) : (
                        projectProgressData.map((project) => (
                            <div key={project.id} className="group">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-500 transition-colors">{project.name}</span>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{project.completed} / {project.total} tasks ({project.progress}%)</span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div 
                                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out dark:from-blue-500 dark:to-blue-400"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Overview;
