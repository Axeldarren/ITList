"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  Priority,
  Project,
  Task,
  useGetAllTasksQuery,
  useGetProjectsQuery,
  useGetTasksByUserQuery,
  useGetUserByIdQuery,
  useGetTeamsQuery,
  useGetUsersQuery,
} from "@/state/api";
import { useAppSelector } from "../../redux";
import { selectCurrentUser } from "@/state/authSlice";
import toast from "react-hot-toast";
import { exportAllProjectsToPDF } from "@/lib/recapPdfGenerator";

// Component Imports
import Header from "@/components/Header";
import { dataGridSxStyles } from "@/lib/utils";
import ModalNewProject from "@/app/(dashboard)/projects/ModalNewProject";
import { AlertTriangle, ChevronDown, Clock, ClipboardList, Plus, FileDown, Check } from "lucide-react";
import Link from "next/link";
import { differenceInDays } from "date-fns";

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
                     <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                        <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 ml-1">{description}</p>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-tertiary">
                    <div className="max-h-40 overflow-y-auto pr-2">
                        <ul className="space-y-2">
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

/**
 * Home Page Component for the Dashboard
 * 
 * This component serves as the main dashboard for the project management application.
 * It displays a summary of user tasks, ongoing projects, and important metrics.
 * 
 * Features:
 * - Personal task overview with priority filtering
 * - Task completion toggle
 * - Project progress tracking
 * - Status cards showing overdue tasks, upcoming deadlines, at-risk projects, and completed tasks
 * - Quick access to ongoing and overdue projects
 * - Export functionality for project recap reports
 * - New project creation
 * 
 * The component uses various data fetching hooks to retrieve:
 * - User information
 * - User-assigned tasks
 * - All projects
 * - All tasks
 * - Teams
 * - Users
 * 
 * It also calculates various derived metrics like:
 * - Tasks that are overdue
 * - Tasks due within the next week
 * - Projects at risk
 * - Completed tasks
 * - Project completion percentages
 * 
 * @returns React component that renders the home dashboard
 */

const HomePage = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Priority | "all">("all");
  const router = useRouter();
  
  const loggedInUser = useAppSelector(selectCurrentUser);
  const UserID = loggedInUser?.userId;

  // --- THIS IS THE FIX ---
  // A single state to control the visibility of all inactive tasks
  const [showInactive, setShowInactive] = useState(false);

  const { data: fullCurrentUser, isLoading: userLoading } = useGetUserByIdQuery(UserID!, { skip: !UserID });
  const { data: userTasks = [], isLoading: tasksLoading } = useGetTasksByUserQuery(UserID!, { skip: !UserID });
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: allTasks = [], isLoading: allTasksLoading } = useGetAllTasksQuery();
  const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  // --- Simplified Filtering Logic ---

  // 1. Get a set of all inactive project IDs
  const inactiveProjectIds = useMemo(() => 
    new Set(projects.filter(p => !!p.deletedAt || p.status === 'Finish' || p.status === 'Cancel').map(p => p.id)), 
  [projects]);

  // 2. Create the master list of tasks to display based on the single checkbox.
  const visibleUserTasks = useMemo(() => {
    if (showInactive) {
      return userTasks; // If checkbox is checked, show all user tasks
    }
    // Otherwise, filter out any task that is completed OR in an inactive project
    return userTasks.filter(task => 
      task.status !== 'Completed' && 
      task.status !== 'Archived' &&
      !inactiveProjectIds.has(task.projectId)
    );
  }, [userTasks, inactiveProjectIds, showInactive]);

  // 3. All stats are now calculated from this single `visibleUserTasks` list.
  const { tasksOverdue, tasksDueThisWeek, projectsAtRisk } = useMemo((): {
    tasksOverdue: Task[];
    tasksDueThisWeek: Task[];
    projectsAtRisk: Project[];
  } => {
    const now = new Date();
    // Use `visibleUserTasks` as the source for all task-based stats
    const tasksOverdue = visibleUserTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed');
    const tasksDueThisWeek = visibleUserTasks.filter(t => t.dueDate && differenceInDays(new Date(t.dueDate), now) <= 7 && differenceInDays(new Date(t.dueDate), now) >= 0);

    // Projects at risk are active projects that are past their deadline
    const projectsAtRisk = projects.filter(p => {
        const isProjectCompleted = allTasks.filter(t => t.projectId === p.id).every(t => t.status === 'Completed');
        return p.endDate && new Date(p.endDate) < now && !isProjectCompleted && !p.deletedAt;
    });

    return { tasksOverdue, tasksDueThisWeek, projectsAtRisk };
  }, [visibleUserTasks, projects, allTasks]);
  
  // 4. Project lists are filtered to only show active/ongoing projects.
  const { ongoingProjects, overdueProjects } = useMemo(() => {
    const now = new Date();
    const activeProjects = projects.filter(p => !p.deletedAt && p.status !== 'Finish' && p.status !== 'Cancel');
    const processedProjects = activeProjects.map(project => {
      const projectTasks = allTasks.filter(t => t.projectId === project.id);
      const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
      const totalTasks = projectTasks.length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return { ...project, percentage, daysRemaining: project.endDate ? differenceInDays(new Date(project.endDate), now) : 0 };
    });
    return {
      ongoingProjects: processedProjects.filter(p => p.endDate && new Date(p.endDate) >= now),
      overdueProjects: processedProjects.filter(p => p.endDate && new Date(p.endDate) < now),
    };
  }, [projects, allTasks]);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);

  const tasksWithProjectName = useMemo(() => visibleUserTasks.map(task => ({
      ...task,
      projectName: projectMap.get(task.projectId) || "Unknown Project",
  })), [visibleUserTasks, projectMap]);

  const filteredTasksForGrid = useMemo(() => {
    if (activeFilter === "all") return tasksWithProjectName;
    return tasksWithProjectName.filter(task => task.priority === activeFilter);
  }, [tasksWithProjectName, activeFilter]);

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/projects/${(params.row as Task).projectId}`);
  };

  const isLoading = projectsLoading || allTasksLoading || userLoading || teamsLoading || usersLoading;

  const handleExportRecap = () => {
      if (isLoading) {
          toast.error("Please wait for all data to load before exporting.");
          return;
      }
      const activeProjects = projects.filter(p => !p.deletedAt && p.status !== 'Finish' && p.status !== 'Cancel');
      exportAllProjectsToPDF(activeProjects, allTasks, teams, users);
  };

  return (
    <div className="h-full w-full bg-transparent p-8">
      <ModalNewProject isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} />
      
      <Header 
        name={`Hi, ${fullCurrentUser?.username}`}
        buttonComponent={
          <div className="flex items-center gap-2">
            <label htmlFor="showInactive" className="flex items-center cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300">
                <input 
                    id="showInactive"
                    type="checkbox" 
                    checked={showInactive} 
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-primary focus:ring-blue-primary"
                />
                <Check size={16} className="mx-1" />
                <span>Show Completed & Archived</span>
            </label>
            <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-2"></div>
            
            <button 
              className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              onClick={handleExportRecap}
              disabled={isLoading}
            >
              <FileDown size={18} /> Export Recap
            </button>
            <button 
              className="flex items-center gap-2 rounded-md bg-blue-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              <Plus size={18} /> Add Project
            </button>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <ExpandableStatsCard<Task> title="Tasks Overdue" value={tasksOverdue.length} icon={<AlertTriangle />} color="bg-red-500" description="Active tasks past their due date." items={tasksOverdue} renderItem={(task) => (<li key={task.id}>{task.title}</li>)} />
          <ExpandableStatsCard<Task> title="Tasks Due This Week" value={tasksDueThisWeek.length} icon={<Clock />} color="bg-yellow-500" description="Active tasks due in the next 7 days." items={tasksDueThisWeek} renderItem={(task) => (<li key={task.id}>{task.title}</li>)} />
          <ExpandableStatsCard<Project> title="Projects at Risk" value={projectsAtRisk.length} icon={<ClipboardList />} color="bg-blue-500" description="Active projects past their end date." items={projectsAtRisk} renderItem={(project) => (<li key={project.id}>{project.name}</li>)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">Your Tasks</h3>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <button onClick={() => setActiveFilter("all")} className={`rounded-full px-4 py-1 text-sm font-medium ${activeFilter === "all" ? 'bg-blue-primary text-white' : 'bg-gray-200 dark:bg-dark-tertiary dark:text-gray-200'}`}>All</button>
                {priorities.map(p => <button key={p} onClick={() => setActiveFilter(p)} className={`rounded-full px-4 py-1 text-sm font-medium ${activeFilter === p ? 'bg-blue-primary text-white' : 'bg-gray-200 dark:bg-dark-tertiary dark:text-gray-200'}`}>{p}</button>)}
              </div>
              <div style={{ height: 400, width: "100%" }}>
                <DataGrid rows={filteredTasksForGrid} columns={taskColumns} loading={tasksLoading} onRowClick={handleRowClick} sx={dataGridSxStyles(isDarkMode)} />
              </div>
            </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
            <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
                <h3 className="mb-4 text-lg font-semibold dark:text-white">Ongoing Projects</h3>
                <div className="space-y-4">
                    {ongoingProjects.map(project => (
                        <Link href={`/projects/${project.id}`} key={project.id} className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary cursor-pointer">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold dark:text-gray-200">{project.name}</span>
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

            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 shadow">
                <h3 className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">Overdue Projects</h3>
                <div className="space-y-4">
                    {overdueProjects.map(project => (
                        <Link href={`/projects/${project.id}`} key={project.id} className="block p-3 rounded-lg hover:bg-red-500/10 cursor-pointer">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-red-800 dark:text-red-300">{project.name}</span>
                                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                    {Math.abs(project.daysRemaining)} days overdue
                                </span>
                            </div>
                        </Link>
                    ))}
                    {overdueProjects.length === 0 && <p className="text-sm text-red-700 dark:text-red-400">No projects are overdue.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;