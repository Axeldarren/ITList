"use client";

import { useMemo, useState } from "react";
import { useGetAllTasksQuery, useGetProjectsQuery, useGetUsersQuery, useGetTimeLogsQuery, useGetProductMaintenancesQuery, Task, TimeLog, User, ProductMaintenance, MaintenanceTask } from "@/state/api";
import { FileSpreadsheet, Loader2 } from "lucide-react";

type Row = {
  no: number;
  department: string;
  projectOrProduct: string;
  issueSubject: string;
  latestProgress: string;
  status: string;
};

// Minimal Excel types to avoid relying on XLSX namespace typings
type ExcelFont = { bold?: boolean };
type ExcelStyle = { font?: ExcelFont };
type ExcelCell = { s?: ExcelStyle };
type MergeRange = { s: { r: number; c: number }; e: { r: number; c: number } };
type ExcelWorkSheet = {
  [addr: string]: ExcelCell | undefined;
};

const WeeklyReport = () => {
  const { data: projects = [], isLoading: pLoading } = useGetProjectsQuery();
  const { data: tasks = [], isLoading: tLoading } = useGetAllTasksQuery();
  // Teams not required for per-department attribution
  const { data: users = [], isLoading: uLoading } = useGetUsersQuery();
  // Fetch time logs for current, previous, and next month to cover cross-month weeks
  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const prev = new Date(now); prev.setMonth(prev.getMonth() - 1);
  const next = new Date(now); next.setMonth(next.getMonth() + 1);
  const prevMonthStr = prev.toISOString().slice(0, 7);
  const nextMonthStr = next.toISOString().slice(0, 7);
  const { data: timeLogs = [], isLoading: lLoading } = useGetTimeLogsQuery({ month: monthStr });
  const { data: prevTimeLogs = [], isLoading: lPrevLoading } = useGetTimeLogsQuery({ month: prevMonthStr });
  const { data: nextTimeLogs = [], isLoading: lNextLoading } = useGetTimeLogsQuery({ month: nextMonthStr });
  // Product maintenance data (for grouping maintenance tasks)
  const { data: productMaintenanceData, isLoading: pmLoading } = useGetProductMaintenancesQuery({ page: 1, limit: 1000 });
  const productMaintenances = productMaintenanceData?.data || [];

  const isLoading = pLoading || tLoading || uLoading || lLoading || lPrevLoading || lNextLoading || pmLoading;

  // Scope: 'week' = only projects with time logs this week, 'all' = all active projects
  const [scope, setScope] = useState<'week' | 'all'>('week');

  // Build a task map for quick lookup

  const taskById = useMemo(() => {
    const map = new Map<number, Task>();
    for (const t of tasks) map.set(t.id, t);
    return map;
  }, [tasks]);

  const rows: Row[] = useMemo(() => {
    const userById = new Map<number, User>();
    users.forEach(u => { if (u.userId != null) userById.set(u.userId, u); });
  // Note: teamById is not required for per-department attribution

    // Determine current week range (Mon-Sun)
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // 0=Mon
    const weekStart = new Date(now);
    weekStart.setHours(0,0,0,0);
    weekStart.setDate(now.getDate() - day);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

  // Merge logs across months to handle week overlaps
  const allLogs = ([] as TimeLog[]).concat(timeLogs as TimeLog[], prevTimeLogs as TimeLog[], nextTimeLogs as TimeLog[]);

  // Filter logs based on scope
  const logs = allLogs.filter(log => {
      if (!log.taskId || !log.startTime) return false;
      if (scope === 'all') return true;
      const started = new Date(log.startTime);
      return started >= weekStart && started <= weekEnd;
    });

    // Filter maintenance logs based on scope (use unified timelogs but pick maintenance ones)
    const maintLogs = allLogs.filter(log => {
      if (!log.maintenanceTaskId || !log.startTime) return false;
      if (scope === 'all') return true;
      const started = new Date(log.startTime);
      return started >= weekStart && started <= weekEnd;
    });

  // (debug logs removed)

    // Map: projectId -> department -> Set<taskId>
    const depTasksByProject = new Map<number, Map<string, Set<number>>>();
    for (const log of logs) {
      if (!log.taskId) continue;
      const task = taskById.get(log.taskId);
      if (!task) continue;
      const projId = task.projectId;
      const user = log.userId ? userById.get(log.userId) : undefined;
      const dept = (user?.department || '').trim() || 'Unknown';
      if (!depTasksByProject.has(projId)) depTasksByProject.set(projId, new Map());
  const depMap = depTasksByProject.get(projId)!;
      if (!depMap.has(dept)) depMap.set(dept, new Set());
      depMap.get(dept)!.add(task.id);
    }

    // Build lookups for product maintenance and maintenance tasks
    const maintTaskById = new Map<number, MaintenanceTask>();
    const productById = new Map<number, ProductMaintenance>();
    for (const pm of productMaintenances as ProductMaintenance[]) {
      productById.set(pm.id, pm);
      for (const mt of pm.maintenanceTasks || []) maintTaskById.set(mt.id, mt);
    }
    // Enhance mapping from logs if API didn't include tasks in productMaintenances
    for (const ml of maintLogs) {
      if (!ml.maintenanceTaskId) continue;
      if (!maintTaskById.has(ml.maintenanceTaskId) && ml.maintenanceTask) {
        maintTaskById.set(ml.maintenanceTaskId, ml.maintenanceTask);
        // Ensure product exists in map for naming
        const pmId = ml.maintenanceTask.productMaintenanceId;
        if (pmId && !productById.has(pmId) && ml.maintenanceTask.productMaintenanceId) {
          // We may not have product details (like name); keep placeholder entry minimal
          // Consumers should guard for missing name
          productById.set(pmId, { id: pmId, name: `Product ${pmId}`, status: 'Active', createdAt: '', updatedAt: '', createdById: 0, createdBy: { userId: 0, username: '' }, maintainers: [], maintenanceTasks: [] } as ProductMaintenance);
        }
      }
    }

  // Map: productMaintenanceId -> department -> Set<maintenanceTaskId>
    const depMaintTasksByProduct = new Map<number, Map<string, Set<number>>>();
    for (const log of maintLogs) {
      if (!log.maintenanceTaskId) continue;
      const mt = maintTaskById.get(log.maintenanceTaskId);
      if (!mt) continue;
      const pmId = mt.productMaintenanceId;
      const user = log.userId ? userById.get(log.userId) : undefined;
      const dept = (user?.department || '').trim() || 'Unknown';
      if (!depMaintTasksByProduct.has(pmId)) depMaintTasksByProduct.set(pmId, new Map());
      const depMap = depMaintTasksByProduct.get(pmId)!;
      if (!depMap.has(dept)) depMap.set(dept, new Set());
      depMap.get(dept)!.add(mt.id);
    }

  // (debug logs removed)

    // Index maintenance logs by task for completion checks
    const maintLogsByTask = new Map<number, TimeLog[]>();
    for (const ml of maintLogs) {
      const id = ml.maintenanceTaskId!;
      if (!maintLogsByTask.has(id)) maintLogsByTask.set(id, []);
      maintLogsByTask.get(id)!.push(ml);
    }

    const out: Row[] = [];
    let rowNo = 1;

    for (const project of projects.filter(p => !p.deletedAt)) {
      const depMap = depTasksByProject.get(project.id);
      if (!depMap || depMap.size === 0) {
        // If scope === 'all', we could skip projects without logs to keep per-department focus
        continue;
      }

      for (const [dept, taskIds] of depMap.entries()) {
        const deptTasks = Array.from(taskIds).map(id => taskById.get(id)!).filter(Boolean);
        // Progress based on department tasks only
        const totalTasks = deptTasks.length;
        const completedTasks = deptTasks.filter(t => (t.status || '').toLowerCase() === 'completed').length;
        const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const latestProgress = `${percent}%`;

        // Titles (single line)
        const titles = deptTasks.map(t => t.title || '(Untitled Task)');
        const issueSubject = titles.length > 20
          ? [...titles.slice(0, 20), `… and ${titles.length - 20} more`].join(' • ')
          : titles.join(' • ');

        out.push({
          no: rowNo++,
          department: dept,
          projectOrProduct: project.name,
          issueSubject,
          latestProgress,
          status: project.status,
        });
      }
    }

  // Add product maintenance rows
    for (const [pmId, depMap] of depMaintTasksByProduct.entries()) {
  const pm = productById.get(pmId);
      if (!pm || !depMap || depMap.size === 0) continue;

      for (const [dept, maintTaskIds] of depMap.entries()) {
        const deptMaintTasks = Array.from(maintTaskIds).map(id => maintTaskById.get(id)!).filter(Boolean);
        const total = deptMaintTasks.length;
        let completed = 0;
        for (const mt of deptMaintTasks) {
          const logsForTask = maintLogsByTask.get(mt.id) || [];
          // Consider completed if there exists a log with an endTime (finished)
          if (logsForTask.some(l => !!l.endTime)) completed += 1;
        }
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const latestProgress = `${percent}%`;
        const status = percent === 100 ? 'Finished' : 'OnProgress';

  const titles = deptMaintTasks.map(t => t.title || '(Untitled Maintenance Task)');
        const issueSubject = titles.length > 20
          ? [...titles.slice(0, 20), `… and ${titles.length - 20} more`].join(' • ')
          : titles.join(' • ');

            out.push({
              no: rowNo++,
              department: dept,
              projectOrProduct: `${pm.name || `Product ${pm.id}`}`,
              issueSubject,
              latestProgress,
              status,
            });
      }
    }

  // (debug logs removed)

    return out;
  }, [projects, users, taskById, timeLogs, prevTimeLogs, nextTimeLogs, scope, productMaintenances]);

  const handleExport = async () => {
    const XLSX = await import("xlsx");

  // (debug logs removed)

    // Build grouped data
  const header = ["No.", "Department", "Project/Product", "Issue/Subject", "Latest Progress", "Status"] as const;
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
        data.push([counter++, gr.department || '', gr.projectOrProduct, gr.issueSubject, gr.latestProgress, gr.status]);
        currentRowIdx += 1;
      }

      // Spacer row between departments
      data.push(['', '', '', '', '', '']);
      currentRowIdx += 1;
    }

  const ws = XLSX.utils.aoa_to_sheet(data) as ExcelWorkSheet;
  // Column widths
  (ws as ExcelWorkSheet & { ['!cols']?: Array<{ wch: number }> })['!cols'] = [
      { wch: 5 },   // No.
      { wch: 18 },  // Department
      { wch: 35 },  // Project/Product
      { wch: 100 }, // Issue/Subject (single line)
      { wch: 22 },  // Latest Progress
      { wch: 20 },  // Status
    ];
    // Merges for department headers
  (ws as ExcelWorkSheet & { ['!merges']?: MergeRange[] })['!merges'] = merges;
    // Auto-filter on global header row
    const lastRow = data.length;
  (ws as ExcelWorkSheet & { ['!autofilter']?: { ref: string } })['!autofilter'] = { ref: `A1:F${lastRow}` };

    // Style: make header row bold
    for (let c = 0; c < header.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      const cell = ws[addr];
      if (cell) {
        cell.s = { ...(cell.s || {}), font: { ...(cell.s?.font || {}), bold: true } };
      }
    }

    // Style: bold department header rows (merged across A-F)
    for (const m of merges) {
      if (m.s.c === 0 && m.e.c >= 1) {
        const addr = XLSX.utils.encode_cell({ r: m.s.r, c: 0 });
        const cell = ws[addr];
        if (cell) {
          cell.s = { ...(cell.s || {}), font: { ...(cell.s?.font || {}), bold: true } };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');
  const uid = (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 6).toUpperCase();
  const fileName = `Weekly_Report_${new Date().toISOString().slice(0,10)}_${uid}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-dark-secondary">
  <h2 className="text-xl font-bold mb-4 dark:text-white">Weekly Report (Excel)</h2>
  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Exports a weekly overview with Department, Project/Product, tasks as Issue/Subject, progress (% only), and Status.</p>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="scope" className="text-sm font-medium text-gray-700 dark:text-gray-300">Scope</label>
        <select
          id="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as 'week' | 'all')}
          className="rounded border px-3 py-2 text-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white"
        >
          <option value="week">This week only (projects/products with time logged)</option>
          <option value="all">All projects/products</option>
        </select>
      </div>

      <button
        onClick={handleExport}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
        {isLoading ? "Loading data..." : `Export Weekly Report`}
      </button>
    </div>
  );
};

export default WeeklyReport;
