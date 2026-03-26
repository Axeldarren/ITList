"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  Priority,
  Task,
  Team,
  User,
  useGetAllTasksQuery,
  useGetProjectsQuery,
  useGetRunningTimeLogQuery,
  useGetTasksByUserQuery,
  useGetTeamsQuery,
  useGetUserByIdQuery,
  useGetUsersQuery,
  useStopTimerMutation,
} from "@/state/api";
import { useAppSelector } from "../../redux";
import { selectCurrentUser } from "@/state/authSlice";

import { dataGridSxStyles } from "@/lib/utils";
import ModalNewProject from "@/app/(dashboard)/projects/ModalNewProject";
import {
  AlertTriangle, ChevronDown, Clock, ClipboardList, Plus, CheckCircle,
  Square, ChevronLeft, ChevronRight, ArrowRight,
  CalendarDays, LayoutDashboard, Layers, Users2, FolderKanban,
  ListTodo, Calendar,
} from "lucide-react";
import Link from "next/link";
import { differenceInDays, differenceInSeconds, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import toast from "react-hot-toast";
import BusinessOwnerHome from './BusinessOwnerHome';

// ─── Running Timer Card ──────────────────────────────────────────────
const RunningTimerCard = () => {
    const { data: runningLog, isLoading } = useGetRunningTimeLogQuery();
    const [stopTimer, { isLoading: isStopping }] = useStopTimerMutation();
    const [elapsedTime, setElapsedTime] = useState("00:00:00");
    const [comment, setComment] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (runningLog) {
            interval = setInterval(() => {
                const seconds = differenceInSeconds(new Date(), new Date(runningLog.startTime));
                const formatted = new Date(seconds * 1000).toISOString().substring(11, 19);
                setElapsedTime(formatted);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [runningLog]);

    const handleStopTimer = () => {
        if (!runningLog || !comment.trim()) {
            toast.error("A comment is required to describe your work.");
            return;
        }
        toast.promise(
            stopTimer({ logId: runningLog.id, commentText: comment }).unwrap(),
            {
                loading: 'Stopping timer...',
                success: 'Timer stopped and work logged!',
                error: (err) => err.data?.message || 'Failed to stop timer.'
            }
        ).then(() => setComment(''));
    };

    if (isLoading || !runningLog) return null;

    return (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm dark:bg-dark-secondary border-l-4 border-green-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">Timer Running</p>
                    <h3 className="text-lg font-bold dark:text-white">{runningLog.task?.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        in project <Link href={`/projects/${runningLog.task?.projectId}`} className="font-semibold hover:underline text-accent-500">{runningLog.task?.project?.name}</Link>
                    </p>
                </div>
                <div className="text-3xl md:text-4xl font-mono font-bold text-gray-800 dark:text-white tracking-wider">
                    {elapsedTime}
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe your work..."
                        rows={1}
                        className="w-full md:w-64 rounded-lg border border-gray-200 p-2.5 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white text-sm"
                    />
                    <button
                        onClick={handleStopTimer}
                        disabled={isStopping || !comment.trim()}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                        <Square size={14} /> Stop Timer
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Calendar View with Inline Tasks + Day Detail Panel ─────────────
const TaskCalendar = ({ tasks }: { tasks: (Task & { projectName: string })[] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const router = useRouter();

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    // Group tasks by day
    const tasksByDay = useMemo(() => {
        const map = new Map<string, (Task & { projectName: string })[]>();
        tasks.forEach(t => {
            if (!t.dueDate) return;
            const key = format(new Date(t.dueDate), 'yyyy-MM-dd');
            const existing = map.get(key) || [];
            existing.push(t);
            map.set(key, existing);
        });
        return map;
    }, [tasks]);

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) { days.push(day); day = addDays(day, 1); }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const MAX_VISIBLE = 2;

    const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
    const selectedTasks = selectedKey ? (tasksByDay.get(selectedKey) || []) : [];

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-500';
            case 'High': return 'bg-orange-500';
            case 'Medium': return 'bg-amber-400';
            case 'Low': return 'bg-blue-400';
            case 'Backlog': return 'bg-gray-400';
            default: return 'bg-gray-300';
        }
    };

    const getStatusStyle = (status?: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
            case 'Work In Progress': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
            case 'Under Review': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div>
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold dark:text-white flex items-center gap-2">
                    <Calendar size={18} className="text-accent-500" />
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronLeft size={16} className="text-gray-500" /></button>
                    <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }} className="text-xs text-accent-500 font-medium px-2 py-1 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors">Today</button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronRight size={16} className="text-gray-500" /></button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-1.5">{d}</div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-[1px] bg-gray-100 dark:bg-dark-tertiary rounded-lg overflow-hidden">
                {days.map((d, i) => {
                    const key = format(d, 'yyyy-MM-dd');
                    const dayTasks = tasksByDay.get(key) || [];
                    const isCurrentMonth = isSameMonth(d, currentMonth);
                    const isToday = isSameDay(d, today);
                    const isSelected = selectedDate && isSameDay(d, selectedDate);
                    const now = new Date();
                    const overdueTasks = dayTasks.filter(t => {
                        const dd = new Date(t.dueDate!); dd.setHours(23,59,59,999);
                        return dd < now && t.status !== 'Completed' && t.status !== 'Under Review';
                    });
                    const remaining = dayTasks.length - MAX_VISIBLE;

                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(isSelected ? null : d)}
                            className={`relative flex flex-col items-start p-1.5 text-left transition-all min-h-[80px] bg-white dark:bg-dark-secondary
                                ${!isCurrentMonth ? 'opacity-40' : ''}
                                ${dayTasks.length > 0 && !isSelected ? 'bg-accent-50/80 dark:bg-accent-900/20' : ''}
                                ${isSelected ? 'ring-2 ring-accent-500 ring-inset z-10' : ''}
                                ${isToday && !isSelected ? 'ring-1 ring-accent-300/50 ring-inset' : ''}
                                hover:bg-accent-100/60 dark:hover:bg-accent-500/20
                            `}
                        >
                            {/* Date number */}
                            <span className={`text-[11px] mb-1 px-1.5 h-5 flex items-center justify-center rounded-full
                                ${isToday ? 'bg-accent-500 text-white font-bold' : dayTasks.length > 0 ? 'bg-accent-200/50 dark:bg-accent-800/50 text-accent-700 dark:text-accent-300 font-bold' : 'text-gray-600 dark:text-gray-300 font-medium'}
                            `}>{format(d, 'd')}</span>

                            {/* Task previews */}
                            <div className="w-full space-y-0.5 flex-1">
                                {dayTasks.slice(0, MAX_VISIBLE).map((t) => (
                                    <div key={t.id} className="flex items-center gap-1 group/task">
                                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${getPriorityColor(t.priority)}`} />
                                        <span className={`text-[9px] leading-tight truncate ${
                                            t.status === 'Completed' ? 'line-through text-gray-400 dark:text-gray-500' :
                                            overdueTasks.includes(t) ? 'text-red-600 dark:text-red-400 font-medium' :
                                            'text-gray-600 dark:text-gray-400'
                                        }`}>{t.title}</span>
                                    </div>
                                ))}
                                {remaining > 0 && (
                                    <span className="text-[9px] font-semibold text-accent-500 dark:text-accent-400">+{remaining} more</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Selected Day Detail Panel */}
            {selectedDate && (
                <div className="mt-4 border border-gray-200 dark:border-dark-tertiary rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-gray-50 dark:bg-dark-tertiary/50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarDays size={16} className="text-accent-500" />
                            <span className="text-sm font-semibold dark:text-white">
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedTasks.length > 0 ? 'bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-medium">Close</button>
                    </div>

                    {selectedTasks.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <CalendarDays size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 dark:text-gray-500">No tasks due on this date</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-dark-tertiary max-h-[280px] overflow-y-auto">
                            {selectedTasks.map((task) => {
                                const now = new Date();
                                const dd = task.dueDate ? new Date(task.dueDate) : null;
                                if (dd) dd.setHours(23,59,59,999);
                                const isOverdue = dd && dd < now && task.status !== 'Completed' && task.status !== 'Under Review';

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => router.push(`/projects/${task.projectId}`)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent-50/50 dark:hover:bg-accent-500/5 cursor-pointer transition-colors group"
                                    >
                                        {/* Priority indicator */}
                                        <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />

                                        {/* Task info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-medium truncate ${task.status === 'Completed' ? 'line-through text-gray-400' : isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                                                    {task.title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">{task.projectName}</span>
                                                {task.priority && (
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">· {task.priority}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${getStatusStyle(task.status)}`}>
                                            {task.status}
                                        </span>

                                        {/* Arrow */}
                                        <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-accent-500 transition-colors flex-shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Running Projects Card ──────────────────────────────────────────
interface ProjectCardData {
    id: number; name: string; ticket_id?: string; status: string;
    startDate?: string; endDate?: string; percentage: number;
    completedTasks: number; totalTasks: number; daysRemaining: number;
}

const ProjectCarouselCard = ({ project }: { project: ProjectCardData }) => {
    const scfg: Record<string, { bg: string; text: string; dot: string }> = {
        'Start': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' },
        'OnProgress': { bg: 'bg-accent-50 dark:bg-accent-500/10', text: 'text-accent-600 dark:text-accent-400', dot: 'bg-accent-500' },
        'Resolve': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
        'Finish': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
    };
    const c = scfg[project.status] || scfg['Start'];
    const label = project.status === 'OnProgress' ? 'Ongoing' : project.status === 'Resolve' ? 'Planning' : project.status;

    return (
        <Link href={`/projects/${project.id}`} className="block min-w-[270px] max-w-[310px] flex-shrink-0 group">
            <div className="rounded-xl border border-gray-200 dark:border-dark-tertiary bg-white dark:bg-dark-secondary p-5 shadow-sm hover:shadow-md hover:border-accent-300 dark:hover:border-accent-500/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                    {project.ticket_id && <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{project.ticket_id}</span>}
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>{label}
                    </div>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white text-sm mb-1 group-hover:text-accent-500 transition-colors truncate">{project.name}</h4>
                {project.startDate && project.endDate && (
                    <p className="text-[11px] text-gray-400 mb-3">{format(new Date(project.startDate), 'd MMM')} – {format(new Date(project.endDate), 'd MMM yyyy')}</p>
                )}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{project.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-dark-tertiary overflow-hidden">
                        <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${project.percentage}%` }} />
                    </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-dark-tertiary">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><CheckCircle size={12} /> {project.completedTasks}/{project.totalTasks} tasks</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {project.daysRemaining > 0 ? `${project.daysRemaining}d left` : `${Math.abs(project.daysRemaining)}d over`}</span>
                    </div>
                    <span className="text-accent-500 font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">View <ArrowRight size={12} /></span>
                </div>
            </div>
        </Link>
    );
};

// ─── Team Members Section (Grouped by Team) ─────────────────────────
const TeamMembersSection = ({ allTasks }: { allTasks: Task[] }) => {
    const { data: users = [] } = useGetUsersQuery();
    const { data: teams = [] } = useGetTeamsQuery();
    const loggedInUser = useAppSelector(selectCurrentUser);
    
    const [activeTeamId, setActiveTeamId] = useState<number | 'all'>('all');
    const [hasSetDefaultTeam, setHasSetDefaultTeam] = useState(false);

    useEffect(() => {
        if (!hasSetDefaultTeam && teams.length > 0 && loggedInUser?.userId) {
            const userTeam = teams.find((t: Team) => t.users?.some((u: User) => u.userId === loggedInUser.userId));
            if (userTeam) {
                setActiveTeamId(userTeam.id);
            }
            setHasSetDefaultTeam(true); // Ensure this only runs once on mount
        }
    }, [teams, loggedInUser, hasSetDefaultTeam]);

    const activeUsers = useMemo(() => users.filter((u: User) => !u.deletedAt && u.role !== 'BUSINESS_OWNER'), [users]);

    const userTeamMap = useMemo(() => {
        const map = new Map<string, Team[]>();
        teams.forEach((team: Team) => {
            team.users?.forEach((u: User) => {
                const existing = map.get(u.userId || '') || [];
                existing.push(team);
                map.set(u.userId || '', existing);
            });
        });
        return map;
    }, [teams]);

    const displayedUsers = useMemo(() => {
        if (activeTeamId === 'all') return activeUsers;
        const team = teams.find((t: Team) => t.id === activeTeamId);
        if (!team?.users) return [];
        const teamUserIds = new Set(team.users.map((u: User) => u.userId));
        return activeUsers.filter((u: User) => teamUserIds.has(u.userId));
    }, [activeUsers, teams, activeTeamId]);

    const userTaskCounts = useMemo(() => {
        const map = new Map<string, { pending: number; done: number }>();
        activeUsers.forEach((u: User) => {
            const uTasks = allTasks.filter(t => t.assignedUserId === u.userId);
            map.set(u.userId || '', {
                done: uTasks.filter(t => t.status === 'Completed').length,
                pending: uTasks.filter(t => t.status !== 'Completed' && t.status !== 'Archived').length,
            });
        });
        return map;
    }, [activeUsers, allTasks]);

    if (activeUsers.length === 0) return null;

    const colors = ['from-accent-400 to-accent-600', 'from-pink-400 to-pink-600', 'from-amber-400 to-amber-600', 'from-cyan-400 to-cyan-600', 'from-emerald-400 to-emerald-600', 'from-rose-400 to-rose-600'];

    return (
        <div className="rounded-xl bg-white dark:bg-dark-secondary p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold dark:text-white flex items-center gap-2">
                    <Users2 size={18} className="text-accent-500" />
                    Team Members
                    <span className="text-xs font-normal text-gray-400 ml-0.5">{displayedUsers.length}</span>
                </h3>
                <Link href="/users" className="text-xs text-accent-500 hover:text-accent-600 font-medium">Manage</Link>
            </div>

            {teams.length > 0 && (
                <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTeamId('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTeamId === 'all' ? 'bg-accent-500 text-white' : 'bg-gray-100 dark:bg-dark-tertiary text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                    >All Teams</button>
                    {teams.map((team: Team) => (
                        <button
                            key={team.id}
                            onClick={() => setActiveTeamId(team.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTeamId === team.id ? 'bg-accent-500 text-white' : 'bg-gray-100 dark:bg-dark-tertiary text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                        >{team.teamName}</button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedUsers.map((user: User) => {
                    const counts = userTaskCounts.get(user.userId || '') || { pending: 0, done: 0 };
                    const initials = user.username ? user.username.substring(0, 1).toUpperCase() : '?';
                    const colorIdx = (user.username?.charCodeAt(0) || 0) % colors.length;
                    const memberTeams = userTeamMap.get(user.userId || '') || [];
                    return (
                        <div key={user.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            {user.profilePictureUrl ? (
                                <img
                                    src={user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${process.env.NEXT_PUBLIC_API_BASE_URL}${user.profilePictureUrl}`}
                                    alt={user.username}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-dark-secondary flex-shrink-0"
                                />
                            ) : (
                                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${colors[colorIdx]} text-white flex items-center justify-center text-sm font-semibold ring-2 ring-white dark:ring-dark-secondary flex-shrink-0`}>
                                    {initials}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{user.username}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] text-amber-500 font-medium">{counts.pending} pending</span>
                                    <span className="text-[11px] text-gray-300 dark:text-gray-600">·</span>
                                    <span className="text-[11px] text-green-500 font-medium">{counts.done} done</span>
                                </div>
                                {memberTeams.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {memberTeams.map((t: Team) => (
                                            <span key={t.id} className="text-[9px] bg-accent-50 dark:bg-accent-500/10 text-accent-500 dark:text-accent-400 px-1.5 py-0.5 rounded font-medium">{t.teamName}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {displayedUsers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No members in this team.</p>}
        </div>
    );
};

// ─── Task Grid Columns ───────────────────────────────────────────────
const taskColumns: GridColDef[] = [
    { field: "title", headerName: "Title", width: 200 },
    { field: "projectName", headerName: "Project", width: 150 },
    { field: "status", headerName: "Status", width: 150 },
    { field: "priority", headerName: "Priority", width: 120 },
    {
      field: "dueDate", headerName: "Due Date", width: 150,
      valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : 'N/A',
    },
];

const priorities: Priority[] = [Priority.Backlog, Priority.Low, Priority.Medium, Priority.High, Priority.Urgent];

// ─── Centralized Loading ─────────────────────────────────────────────
const CentralizedLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-80px)] w-full">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-accent-500 animate-spin" />
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading your workspace</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Fetching projects, tasks, and team data...</p>
            </div>
        </div>
    </div>
);

// ─── Main Home Page ──────────────────────────────────────────────────
const HomePage = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [taskView, setTaskView] = useState<'list' | 'calendar'>('list');
  const [taskTab, setTaskTab] = useState<'active' | 'today' | 'tomorrow' | 'overdue' | 'all'>('active');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  const router = useRouter();

  const loggedInUser = useAppSelector(selectCurrentUser);
  const UserID = loggedInUser?.userId;
  const { data: fullCurrentUser, isLoading: userLoading } = useGetUserByIdQuery(UserID!, { skip: !UserID });

  // Truth-seeking: server data preferred over local state
  const activeUser = fullCurrentUser || loggedInUser;
  const isBusinessOwner = activeUser?.role === 'BUSINESS_OWNER';
  const isAdmin = activeUser?.role === 'ADMIN';
  const { data: userTasks = [], isLoading: tasksLoading } = useGetTasksByUserQuery({ userId: UserID! }, { skip: !UserID });
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: allTasks = [], isLoading: allTasksLoading } = useGetAllTasksQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const assignedUserTasks = useMemo(() => {
    if (!UserID) return [];
    return userTasks.filter(task => task.assignedUserId === UserID);
  }, [userTasks, UserID]);

  const activeUserTasks = useMemo(() => {
    return assignedUserTasks.filter(task => task.status !== 'Completed' && task.status !== 'Archived');
  }, [assignedUserTasks]);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);

  const tasksForGrid = useMemo(() => {
    return assignedUserTasks.filter(task => task.status !== 'Archived').map(task => ({
        ...task,
        projectName: projectMap.get(task.projectId) || "Unknown Project",
    }));
  }, [assignedUserTasks, projectMap]);

  // Azira-style tab filtering
  const filteredTasksForGrid = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

    let filtered: typeof tasksForGrid;
    switch (taskTab) {
      case 'today':
        filtered = tasksForGrid.filter(t => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) < tomorrow && t.status !== 'Completed');
        break;
      case 'tomorrow':
        filtered = tasksForGrid.filter(t => t.dueDate && new Date(t.dueDate) >= tomorrow && new Date(t.dueDate) < dayAfter && t.status !== 'Completed');
        break;
      case 'overdue':
        filtered = tasksForGrid.filter(t => {
          if (!t.dueDate || t.status === 'Completed' || t.status === 'Under Review') return false;
          const dd = new Date(t.dueDate); dd.setHours(23,59,59,999);
          return dd < now;
        });
        break;
      case 'all':
        filtered = tasksForGrid;
        break;
      default:
        filtered = tasksForGrid.filter(t => t.status !== 'Completed');
        break;
    }
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);
    if (projectFilter !== 'all') filtered = filtered.filter(t => t.projectId === projectFilter);
    return filtered;
  }, [tasksForGrid, taskTab, priorityFilter, projectFilter]);

  const taskCounts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
    return {
      active: tasksForGrid.filter(t => t.status !== 'Completed').length,
      today: tasksForGrid.filter(t => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) < tomorrow && t.status !== 'Completed').length,
      tomorrow: tasksForGrid.filter(t => t.dueDate && new Date(t.dueDate) >= tomorrow && new Date(t.dueDate) < dayAfter && t.status !== 'Completed').length,
      overdue: tasksForGrid.filter(t => {
        if (!t.dueDate || t.status === 'Completed' || t.status === 'Under Review') return false;
        const dd = new Date(t.dueDate); dd.setHours(23,59,59,999); return dd < now;
      }).length,
      all: tasksForGrid.length,
    };
  }, [tasksForGrid]);

  const { tasksOverdue, tasksInProgress, tasksTodo } = useMemo(() => {
    const now = new Date();
    return {
      tasksOverdue: activeUserTasks.filter(t => {
        if (!t.dueDate || t.status === 'Completed' || t.status === 'Under Review') return false;
        const dd = new Date(t.dueDate); dd.setHours(23,59,59,999); return dd < now;
      }),
      tasksInProgress: activeUserTasks.filter(t => t.status === 'Work In Progress'),
      tasksTodo: activeUserTasks.filter(t => t.status === 'To Do'),
    };
  }, [activeUserTasks]);

  const { ongoingProjects, overdueProjects } = useMemo(() => {
    const now = new Date();
    const prjs = projects.filter(p => !p.deletedAt && p.status !== 'Finish' && p.status !== 'Cancel');
    const proc = prjs.map(project => {
        const pTasks = allTasks.filter(t => t.projectId === project.id);
        const comp = pTasks.filter(t => t.status === 'Completed').length;
        const total = pTasks.length;
        return {
            ...project,
            ticket_id: project.ticket_id || project.projectTicket?.ticket_id || '',
            percentage: total > 0 ? Math.round((comp / total) * 100) : 0,
            completedTasks: comp, totalTasks: total,
            daysRemaining: project.endDate ? differenceInDays(new Date(project.endDate), now) : 0
        };
    });
    return {
      ongoingProjects: proc.filter(p => p.endDate && new Date(p.endDate) >= now),
      overdueProjects: proc.filter(p => p.endDate && new Date(p.endDate) < now),
    };
  }, [projects, allTasks]);

  const userProjects = useMemo(() => {
    const ids = new Set(assignedUserTasks.map(t => t.projectId));
    return projects.filter(p => ids.has(p.id));
  }, [assignedUserTasks, projects]);

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/projects/${(params.row as Task).projectId}`);
  };


  const isLoading = projectsLoading || allTasksLoading || userLoading || tasksLoading;

  if (isLoading) return <CentralizedLoading />;
  if (isBusinessOwner) return <BusinessOwnerHome />;

  const greetings = [
    "It's giving boss energy. Go get that bread!",
    "Let's crush those tasks today!",
    "Another day, another milestone!",
    "Focus mode: activated.",
  ];
  const greeting = greetings[new Date().getDay() % greetings.length];

  return (
    <div className="h-full w-full bg-gray-50/50 dark:bg-dark-bg p-6 md:p-8 page-fade-in">
      <ModalNewProject isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} />

      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-4">
          {fullCurrentUser?.profilePictureUrl ? (
            <img
              src={fullCurrentUser.profilePictureUrl.startsWith('http') ? fullCurrentUser.profilePictureUrl : `${process.env.NEXT_PUBLIC_API_BASE_URL}${fullCurrentUser.profilePictureUrl}`}
              alt="Profile"
              className="h-14 w-14 rounded-full object-cover ring-2 ring-accent-200 dark:ring-accent-500/30 hidden md:block"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center text-xl font-bold hidden md:flex ring-2 ring-accent-200 dark:ring-accent-500/30">
              {fullCurrentUser?.username?.substring(0, 1).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Hello, {fullCurrentUser?.username} <span className="inline-block animate-[wave_2s_ease-in-out_infinite] origin-[70%_70%]">👋</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{greeting}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {loggedInUser?.role === 'ADMIN' && (
            <button
              className="flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-600 hover:shadow-lg hover:shadow-accent-500/25"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* ─── Running Projects ─────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FolderKanban size={18} className="text-accent-500" /> Running Projects
          </h2>
          <Link href="/timeline" className="text-xs text-accent-500 hover:text-accent-600 font-medium flex items-center gap-1">View All <ArrowRight size={12} /></Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
          {[...ongoingProjects, ...overdueProjects].slice(0, 8).map(p => <ProjectCarouselCard key={p.id} project={p} />)}
          {ongoingProjects.length === 0 && overdueProjects.length === 0 && (
            <div className="w-full text-center py-10 text-gray-400"><ClipboardList size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No running projects</p></div>
          )}
        </div>
      </div>

      {/* ─── Task Overview Cards ──────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <LayoutDashboard size={18} className="text-accent-500" /> Task Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle size={18} className="text-red-500" /></div>
            <div><p className="text-xs font-medium text-red-600/70 dark:text-red-400/70">Critical</p><p className="text-2xl font-bold text-red-600 dark:text-red-400">{tasksOverdue.length}</p></div>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><ListTodo size={18} className="text-blue-500" /></div>
            <div><p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">To Do</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tasksTodo.length}</p></div>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Clock size={18} className="text-amber-500" /></div>
            <div><p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">In Progress</p><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{tasksInProgress.length}</p></div>
          </div>
          <div className="rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30"><CalendarDays size={18} className="text-orange-500" /></div>
            <div><p className="text-xs font-medium text-orange-600/70 dark:text-orange-400/70">Overdue</p><p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{overdueProjects.length}</p></div>
          </div>
        </div>
      </div>

      {/* ─── Team Members ─────────────────────────────────────────── */}
      <div className="mb-6">
        <TeamMembersSection allTasks={allTasks} />
      </div>

      <RunningTimerCard />

      {/* ─── Tasks Section (Azira-style tabs + filters + calendar toggle) */}
      <div className="rounded-xl bg-white dark:bg-dark-secondary p-5 shadow-sm mb-6">
        {/* Top bar: tabs, view toggle, filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Task tabs (only visible in list view) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {([
                { key: 'active', label: 'Tasks', icon: <Layers size={14} />, count: taskCounts.active },
                { key: 'today', label: 'Today', icon: <Calendar size={14} />, count: taskCounts.today },
                { key: 'tomorrow', label: 'Tomorrow', icon: <CalendarDays size={14} />, count: taskCounts.tomorrow },
                { key: 'overdue', label: 'Overdue', icon: <AlertTriangle size={14} />, count: taskCounts.overdue },
                { key: 'all', label: 'All Tasks', icon: <ClipboardList size={14} />, count: taskCounts.all },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setTaskTab(tab.key); setTaskView('list'); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    taskView === 'list' && taskTab === tab.key
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    taskView === 'list' && taskTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-dark-tertiary text-gray-500 dark:text-gray-400'
                  }`}>{tab.count}</span>
                </button>
              ))}
              {/* Calendar Tab */}
              <button
                onClick={() => setTaskView('calendar')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  taskView === 'calendar'
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <Calendar size={14} /> Calendar
              </button>
            </div>

            {/* Filters (visible in list view only) */}
            {taskView === 'list' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                    className="appearance-none text-xs bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-tertiary rounded-lg px-3 py-2 pr-7 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-400/30"
                  >
                    <option value="all">All Priorities</option>
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="appearance-none text-xs bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-tertiary rounded-lg px-3 py-2 pr-7 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-400/30 max-w-[160px]"
                  >
                    <option value="all">All Projects</option>
                    {userProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content: List or Calendar */}
        {taskView === 'list' ? (
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid rows={filteredTasksForGrid} columns={taskColumns} loading={tasksLoading} onRowClick={handleRowClick} sx={dataGridSxStyles(isDarkMode)} />
          </div>
        ) : (
          <TaskCalendar tasks={tasksForGrid} />
        )}
      </div>
    </div>
  );
};

export default HomePage;