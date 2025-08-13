"use client";

import { useMemo, useState } from "react";
import { useGetAllTasksQuery, useGetProjectsQuery, useGetTeamsQuery, useGetUsersQuery, useGetTimeLogsQuery, Task, TimeLog } from "@/state/api";
import { FileSpreadsheet, Loader2 } from "lucide-react";

type Row = {
  no: number;
  department: string;
  projectName: string;
  issueSubject: string;
  latestProgress: string;
  status: string;
};

const WeeklyReport = () => {
  const { data: projects = [], isLoading: pLoading } = useGetProjectsQuery();
  const { data: tasks = [], isLoading: tLoading } = useGetAllTasksQuery();
  const { data: teams = [], isLoading: tmLoading } = useGetTeamsQuery();
  const { data: users = [], isLoading: uLoading } = useGetUsersQuery();
  // Fetch time logs for current month; we'll filter to current week client-side
  const monthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: timeLogs = [], isLoading: lLoading } = useGetTimeLogsQuery({ month: monthStr });

  const isLoading = pLoading || tLoading || tmLoading || uLoading || lLoading;

  // Scope: 'week' = only projects with time logs this week, 'all' = all active projects
  const [scope, setScope] = useState<'week' | 'all'>('week');

  const taskGroupsByProject = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const task of tasks) {
      if (!map.has(task.projectId)) map.set(task.projectId, []);
      map.get(task.projectId)!.push(task);
    }
    return map;
  }, [tasks]);

  const rows: Row[] = useMemo(() => {
    const userById = new Map(users.map(u => [u.userId!, u] as const));
    const teamById = new Map(teams.map(t => [t.id, t] as const));
    // Determine current week range (Mon-Sun)
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // 0=Mon
    const weekStart = new Date(now);
    weekStart.setHours(0,0,0,0);
    weekStart.setDate(now.getDate() - day);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    const logsThisWeekTaskIds = new Set<number>();
    (timeLogs as TimeLog[]).forEach(log => {
      if (!log.taskId || !log.startTime) return;
      const started = new Date(log.startTime);
      if (started >= weekStart && started <= weekEnd) {
        logsThisWeekTaskIds.add(log.taskId);
      }
    });

    return projects
      .filter(p => !p.deletedAt)
      // Only include projects that have at least one task with time logged this week (unless scope === 'all')
      .filter(project => {
        if (scope === 'all') return true;
        const projectTasks = taskGroupsByProject.get(project.id) || [];
        return projectTasks.some(t => logsThisWeekTaskIds.has(t.id));
      })
      .map((project, idx) => {
        const team = project.teamId ? teamById.get(project.teamId) : undefined;
        const manager = team?.projectManagerUserId ? userById.get(team.projectManagerUserId) : undefined;
        const productOwner = team?.productOwnerUserId ? userById.get(team.productOwnerUserId) : undefined;
        const department = manager?.department || productOwner?.department || "";

        const projectTasks = taskGroupsByProject.get(project.id) || [];
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(t => (t.status || "").toLowerCase() === "completed".toLowerCase()).length;
        const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const latestProgress = totalTasks > 0 ? `${percent}% (${completedTasks}/${totalTasks})` : "0% (0/0)";

        // Join task titles into a single line (no line breaks)
        const titles = projectTasks.map(t => `${t.title || "(Untitled Task)"}`);
        const issueSubject = titles.length > 20 ? [...titles.slice(0, 20), `… and ${titles.length - 20} more`].join(" • ") : titles.join(" • ");

        return {
          no: idx + 1,
          department,
          projectName: project.name,
          issueSubject,
          latestProgress,
          status: project.status,
        } as Row;
      });
  }, [projects, teams, users, taskGroupsByProject, timeLogs, scope]);

  const handleExport = async () => {
    const XLSX = await import("xlsx");

    // Build grouped data
    const header = ["No.", "Department", "Project Name", "Issue/Subject", "Latest Progress", "Status"] as const;
    const groups = new Map<string, Row[]>();
    const depts = rows.map(r => r.department && r.department.trim() ? r.department.trim() : "Unassigned");
    const orderedDepts = Array.from(new Set(depts)).sort((a,b) => a.localeCompare(b));
    for (const r of rows) {
      const key = r.department && r.department.trim() ? r.department.trim() : "Unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    const data: Array<Array<string | number>> = [];
    // Global header
    data.push([...header]);

    // Track merges for department headers
    type MergeRange = { s: { r: number; c: number }; e: { r: number; c: number } };
    const merges: MergeRange[] = [];

    let currentRowIdx = 1; // since header is at row 0
    let counter = 1;
    for (const dept of orderedDepts) {
      const groupRows = groups.get(dept) || [];
      if (groupRows.length === 0) continue;

      // Group header row (merged across A-F)
      data.push([`Department: ${dept}`, '', '', '', '', '']);
      merges.push({ s: { r: currentRowIdx, c: 0 }, e: { r: currentRowIdx, c: 5 } });
      currentRowIdx += 1;

      // Data rows
      for (const gr of groupRows) {
        data.push([counter++, gr.department || '', gr.projectName, gr.issueSubject, gr.latestProgress, gr.status]);
        currentRowIdx += 1;
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    // Column widths
    (ws as unknown as { ['!cols']?: Array<{ wch: number }> })['!cols'] = [
      { wch: 5 },   // No.
      { wch: 18 },  // Department
      { wch: 35 },  // Project Name
      { wch: 100 }, // Issue/Subject (single line)
      { wch: 22 },  // Latest Progress
      { wch: 20 },  // Status
    ];
    // Merges for department headers
    (ws as unknown as { ['!merges']?: MergeRange[] })['!merges'] = merges;
    // Auto-filter on global header row
    const lastRow = data.length;
    (ws as unknown as { ['!autofilter']?: { ref: string } })['!autofilter'] = { ref: `A1:F${lastRow}` };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');
    const fileName = `Weekly_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-dark-secondary">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Weekly Report (Excel)</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Exports a weekly overview with Department, Project, tasks as Issue/Subject, progress (% completed), and Project Status.</p>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="scope" className="text-sm font-medium text-gray-700 dark:text-gray-300">Scope</label>
        <select
          id="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as 'week' | 'all')}
          className="rounded border px-3 py-2 text-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white"
        >
          <option value="week">This week only (projects with time logged)</option>
          <option value="all">All projects</option>
        </select>
      </div>

      <button
        onClick={handleExport}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
        {isLoading ? "Loading data..." : `Export Weekly Report (${rows.length} Projects)`}
      </button>
    </div>
  );
};

export default WeeklyReport;
