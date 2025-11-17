"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  Priority,
  Project,
  Task,
  useGetAllTasksQuery,
  useGetProjectsQuery,
  useGetRunningTimeLogQuery,
  useGetTasksByUserQuery,
  useGetUserByIdQuery,
  useGetUserWeeklyStatsQuery,
  useStopTimerMutation,
} from "@/state/api";
import { useAppSelector } from "../../redux";
import { selectCurrentUser } from "@/state/authSlice";

// Component Imports
import Header from "@/components/Header";
import { dataGridSxStyles } from "@/lib/utils";
import ModalNewProject from "@/app/(dashboard)/projects/ModalNewProject";
import { AlertTriangle, ChevronDown, Clock, ClipboardList, Plus, CheckCircle, Square, ChevronLeft, ChevronRight, TrendingUp, Timer } from "lucide-react";
import Link from "next/link";
import { differenceInDays, differenceInSeconds } from "date-fns";
import toast from "react-hot-toast";
import { StatsSkeleton, CardSkeleton } from "@/components/Skeleton";
import { InlineLoading } from "@/components/LoadingSpinner";

// --- Expandable Stats Card Component ---
interface ExpandableStatsCardProps<T> {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    description: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    viewAllLink?: string;
}

const ExpandableStatsCard = <T,>({ title, value, icon, color, description, items, renderItem, viewAllLink }: ExpandableStatsCardProps<T>) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="flex flex-col p-4 bg-white rounded-lg shadow dark:bg-dark-secondary">
            <div className="flex items-center">
                <div className={`p-3 mr-4 text-white rounded-full ${color}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white">{value}</p>
                </div>
                {items.length > 0 && (
                     <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-tertiary dark:text-gray-400">
                        <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 ml-1">{description}</p>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-tertiary">
                    <div className="max-h-40 overflow-y-auto pr-2">
                        <ul className="space-y-2 dark:text-white">
                            {items.map(renderItem)}
                        </ul>
                    </div>
                    {viewAllLink && (
                        <div className="mt-2 text-right">
                            <Link href={viewAllLink} className="text-sm font-medium text-blue-primary hover:underline">
                                View All
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

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

    if (isLoading || !runningLog) {
         return null;
    }

    return (
        <div className="mb-8 rounded-lg bg-white p-4 shadow-lg dark:bg-dark-secondary border-l-4 border-green-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">Timer Running</p>
                    <h3 className="text-lg font-bold dark:text-white">{runningLog.task?.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        in project <Link href={`/projects/${runningLog.task?.projectId}`} className="font-semibold hover:underline">{runningLog.task?.project?.name}</Link>
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
                        className="w-full md:w-64 rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white"
                    />
                    <button 
                        onClick={handleStopTimer}
                        disabled={isStopping || !comment.trim()}
                        className="flex items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                        <Square size={16} /> Stop Timer
                    </button>
                </div>
            </div>
        </div>
    );
};

const WeeklyStatsCard = ({ userId }: { userId: number }) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const { data: weeklyStats, isLoading } = useGetUserWeeklyStatsQuery({ userId, weekOffset });
    
    const getWeekDateRange = (offset: number) => {
        const now = new Date();
        const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const targetWeekStart = new Date(currentWeekStart);
        targetWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
        
        const targetWeekEnd = new Date(targetWeekStart);
        targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
        
        const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return `${formatDate(targetWeekStart)} - ${formatDate(targetWeekEnd)}`;
    };
    
    const isCurrentWeek = weekOffset === 0;
    
    if (isLoading) {
        return (
            <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 dark:bg-gray-700"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold dark:text-white">Weekly Progress</h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setWeekOffset(prev => prev - 1)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[120px] text-center">
                        {isCurrentWeek ? 'This Week' : getWeekDateRange(weekOffset)}
                    </span>
                    <button 
                        onClick={() => setWeekOffset(prev => prev + 1)}
                        disabled={weekOffset >= 0}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">Story Points</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {weeklyStats?.totalStoryPoints || 0}
                    </span>
                </div>
                
                    {/* Total Hours Weekly (Maintenance + Task) */}
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Timer size={20} className="text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-800 dark:text-green-200">Total Hours (Weekly)</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {((weeklyStats?.timeLogs?.reduce((acc, log) => acc + (log.duration || 0), 0) || 0) / 3600).toFixed(1)}h
                        </span>
                    </div>
                
                {weeklyStats?.completedTasks && weeklyStats.completedTasks.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Completed Tasks ({weeklyStats.completedTasks.length})
                        </p>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                            {weeklyStats.completedTasks.map((task) => (
                                <div key={task.id} className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                                    <span className="truncate flex-1">{task.title}</span>
                                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                                        {task.points}pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const taskColumns: GridColDef[] = [
    { field: "title", headerName: "Title", width: 200 },
    { field: "projectName", headerName: "Project", width: 150 },
    { field: "status", headerName: "Status", width: 150 },
    { field: "priority", headerName: "Priority", width: 120 },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 150,
      valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : 'N/A',
    },
];

const priorities: Priority[] = [Priority.Backlog, Priority.Low, Priority.Medium, Priority.High, Priority.Urgent];

const HomePage = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Priority | "all" | "Completed">("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const router = useRouter();
  
  const loggedInUser = useAppSelector(selectCurrentUser);
  const UserID = loggedInUser?.userId;

  // --- Data Fetching ---
  const { data: fullCurrentUser, isLoading: userLoading } = useGetUserByIdQuery(UserID!, { skip: !UserID });
  const { data: userTasks = [], isLoading: tasksLoading } = useGetTasksByUserQuery(UserID!, { skip: !UserID });
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: allTasks = [], isLoading: allTasksLoading } = useGetAllTasksQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  // --- THIS IS THE FIX: The hooks are now in a logical, dependent order ---

  // 1. First, create the helper maps and primary filtered lists.
const assignedUserTasks = useMemo(() => {
    if (!UserID) return [];
    return userTasks.filter(task => task.assignedUserId === UserID);
  }, [userTasks, UserID]);
  
  // 2. Create a list of "active" tasks for stats cards (no completed or archived).
  const activeUserTasks = useMemo(() => {
    return assignedUserTasks.filter(task => task.status !== 'Completed' && task.status !== 'Archived');
  }, [assignedUserTasks]);
  
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);
  
  // 3. The grid can show completed tasks (but never archived ones).
  const tasksForGrid = useMemo(() => {
    return assignedUserTasks.filter(task => task.status !== 'Archived').map(task => ({
        ...task,
        projectName: projectMap.get(task.projectId) || "Unknown Project",
    }));
  }, [assignedUserTasks, projectMap]);
  
  const filteredTasksForGrid = useMemo(() => {
    const sourceTasks = showCompleted 
      ? tasksForGrid.filter(task => task.status === "Completed")
      : tasksForGrid.filter(task => task.status !== "Completed");

    if (activeFilter === "all" || showCompleted) return sourceTasks;
    return sourceTasks.filter(task => task.priority === activeFilter);
  }, [tasksForGrid, activeFilter, showCompleted]);

  // 4. All stats cards are now calculated from the correct lists.
  const { tasksOverdue, tasksDueThisWeek, tasksCompleted } = useMemo(() => {
    const now = new Date();
    // Overdue and Due This Week are based on the active-only list.
    const overdue = activeUserTasks.filter(t => {
                if (!t.dueDate || t.status === 'Completed' || t.status === 'Under Review') return false;
                const dueDate = new Date(t.dueDate);
                dueDate.setHours(23, 59, 59, 999);
                return dueDate < now;
            });
    const dueThisWeek = activeUserTasks.filter(t => t.dueDate && differenceInDays(new Date(t.dueDate), now) <= 7);
    
    // The "completed" card shows all non-archived completed tasks assigned to the user.
    const completed = assignedUserTasks.filter(t => t.status === 'Completed');
    
    return { 
      tasksOverdue: overdue, 
      tasksDueThisWeek: dueThisWeek, 
      tasksCompleted: completed 
    };
  }, [activeUserTasks, assignedUserTasks]);
  
  // 5. Project lists are filtered to only show active/ongoing projects.
  const { ongoingProjects, overdueProjects } = useMemo(() => {
    const now = new Date();
    const activeProjects = projects.filter(p => !p.deletedAt && p.status !== 'Finish' && p.status !== 'Cancel');
        const processedProjects = activeProjects.map(project => {
            const projectTasks = allTasks.filter(t => t.projectId === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
            const totalTasks = projectTasks.length;
            const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            // Ensure ticket_id is always present
            return {
                ...project,
                ticket_id: project.ticket_id || project.projectTicket?.ticket_id || '',
                percentage,
                daysRemaining: project.endDate ? differenceInDays(new Date(project.endDate), now) : 0
            };
        });
    return {
      ongoingProjects: processedProjects.filter(p => p.endDate && new Date(p.endDate) >= now),
      overdueProjects: processedProjects.filter(p => p.endDate && new Date(p.endDate) < now),
    };
  }, [projects, allTasks]);

  // Define projectsAtRisk as an alias for overdueProjects for stats card
  const projectsAtRisk = overdueProjects;

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/projects/${(params.row as Task).projectId}`);
  };

  const isLoading = projectsLoading || allTasksLoading || userLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="h-full w-full bg-transparent p-8 page-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded skeleton mb-4"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
        </div>
        <StatsSkeleton />
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InlineLoading height="400px" text="Loading your tasks..." />
          </div>
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full bg-transparent p-8 page-fade-in">
      <ModalNewProject isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} />
      
      <Header 
        name={`Hi, ${fullCurrentUser?.username}`}
        buttonComponent={
          loggedInUser?.isAdmin && (
            <div className="flex items-center gap-2">
              <button 
                className="flex items-center gap-2 rounded-md bg-blue-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                onClick={() => setIsNewProjectModalOpen(true)}
              >
                <Plus size={18} /> Add Project
              </button>
            </div>
          )
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ExpandableStatsCard<Task> title="Tasks Overdue" value={tasksOverdue.length} icon={<AlertTriangle />} color="bg-red-500" description="Active tasks past their due date." items={tasksOverdue} renderItem={(task) => (<li key={task.id}>{task.title}</li>)} />
          <ExpandableStatsCard<Task> title="Tasks Due This Week" value={tasksDueThisWeek.length} icon={<Clock />} color="bg-yellow-500" description="Active tasks due in the next 7 days." items={tasksDueThisWeek} renderItem={(task) => (<li key={task.id}>{task.title}</li>)} />
          <ExpandableStatsCard<Project> title="Projects at Risk" value={projectsAtRisk.length} icon={<ClipboardList />} color="bg-blue-500" description="Active projects past their end date." items={projectsAtRisk} renderItem={(project) => (<li key={project.id}>{project.name}</li>)} />
          <ExpandableStatsCard<Task> title="My Completed Tasks" value={tasksCompleted.length} icon={<CheckCircle />} color="bg-green-500" description="All tasks you have completed." items={tasksCompleted} renderItem={(task) => (<li key={task.id}>{task.title}</li>)} />
      </div>

      <RunningTimerCard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">Your Tasks</h3>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Show Completed</span>
                    <input 
                        type="checkbox"
                        id="showCompleted"
                        name="showCompleted"
                        checked={showCompleted}
                        onChange={() => setShowCompleted(!showCompleted)}
                        className="h-4 w-4 rounded text-blue-primary focus:ring-blue-primary"
                        autoComplete="off"
                    />
                </div>
              </div>
              <div className={`mb-4 flex flex-wrap gap-2 ${showCompleted ? 'opacity-50 pointer-events-none' : ''}`}>
                <button onClick={() => setActiveFilter("all")} className={`rounded-full px-4 py-1 text-sm font-medium ${activeFilter === "all" ? 'bg-blue-primary text-white' : 'bg-gray-200 dark:bg-dark-tertiary dark:text-gray-200'}`}>All</button>
                                {priorities.map(p => (
                                    <button 
                                        key={p} 
                                        id={`priority-filter-${p}`}
                                        name={`priority-filter-${p}`}
                                        onClick={() => setActiveFilter(p)} 
                                        className={`rounded-full px-4 py-1 text-sm font-medium ${activeFilter === p ? 'bg-blue-primary text-white' : 'bg-gray-200 dark:bg-dark-tertiary dark:text-gray-200'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
              </div>
              <div style={{ height: 400, width: "100%" }}>
                <DataGrid rows={filteredTasksForGrid} columns={taskColumns} loading={tasksLoading} onRowClick={handleRowClick} sx={dataGridSxStyles(isDarkMode)} />
              </div>
            </div>

            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 shadow">
                <h3 className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">Overdue Projects</h3>
                <div className="space-y-4">
                    {overdueProjects.map(project => (
                        <Link href={`/projects/${project.id}`} key={project.id} className="block p-3 rounded-lg hover:bg-red-500/10 cursor-pointer">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-red-800 dark:text-red-300">{project.name}</span>
                                    {project.ticket_id && (
                                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">Ticket #{project.ticket_id}</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                    {Math.abs(project.daysRemaining)} days overdue
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="h-2 w-full flex-1 rounded-full bg-gray-200 dark:bg-dark-tertiary">
                                    <div className="h-2 rounded-full bg-red-500" style={{ width: `${project.percentage}%` }} />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{project.percentage}%</span>
                            </div>
                        </Link>
                    ))}
                    {overdueProjects.length === 0 && <p className="text-sm text-red-700 dark:text-red-400">No projects are overdue.</p>}
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
            {UserID && <WeeklyStatsCard userId={UserID} />}
            
            <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
                <h3 className="mb-4 text-lg font-semibold dark:text-white">Ongoing Projects</h3>
                <div className="space-y-4">
                    {ongoingProjects.map(project => (
                        <Link href={`/projects/${project.id}`} key={project.id} className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary cursor-pointer">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-semibold dark:text-gray-200">{project.name}</span>
                                    {project.ticket_id && (
                                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">Ticket #{project.ticket_id}</span>
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${project.daysRemaining < 7 ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {project.daysRemaining} days left
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="h-2 w-full flex-1 rounded-full bg-gray-200 dark:bg-dark-tertiary">
                                    <div className="h-2 rounded-full bg-blue-primary" style={{ width: `${project.percentage}%` }} />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{project.percentage}%</span>
                            </div>
                        </Link>
                    ))}
                    {ongoingProjects.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No projects are currently ongoing.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;