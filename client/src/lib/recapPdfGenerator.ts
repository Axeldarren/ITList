import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, ProjectVersion, Task, Team, User } from '@/state/api';

export type ReportOptions = {
    includeId: boolean;
    includeVersion: boolean;
    includeStatus: boolean;
    includeProgress: boolean;
    includeDates: boolean;
    includePO: boolean;
    includePM: boolean;
    includeTasks?: boolean; // NEW: Option to include tasks
    includeDescription?: boolean; // NEW: Option to include project description
    includeMembers: boolean;
};

export const exportAllProjectsToPDF = (
    reportItems: (Project | ProjectVersion)[], 
    allTasks: Task[],
    teams: Team[],
    users: User[],
    options: ReportOptions
) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(22);
    doc.text("All Projects Recap Report", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

    const head: string[] = ['#', 'Project'];
    if (options.includeId) head.push('ID');
    if (options.includeStatus) head.push('Status');
    if (options.includeVersion) head.push('Ver');
    if (options.includeProgress) head.push('Progress');
    if (options.includeDates) { head.push('Start'); head.push('End'); }
    if (options.includePO) head.push('PO');
    if (options.includePM) head.push('PM');
    if (options.includeMembers) head.push('Team Members');

    const body = reportItems.map((item, index) => {
        const row: (string | number)[] = [index + 1, item.name];
        
        let teamId: number | undefined;
        if ('teamId' in item && item.teamId) {
            teamId = item.teamId;
        } else if ('projectTeams' in item && item.projectTeams && Array.isArray(item.projectTeams)) {
            teamId = item.projectTeams[0]?.teamId;
        }

        const team = teams.find(t => t.id === teamId);
        
        if (options.includeId) row.push(item.id);
        if (options.includeStatus) row.push(item.status);
        if (options.includeVersion) row.push(`V${item.version}`);
        if (options.includeProgress) {
            const projectTasks = allTasks.filter(task => task.projectId === item.id && task.version === item.version);
            const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
            row.push(projectTasks.length > 0 ? `${Math.round((completedTasks / projectTasks.length) * 100)}%` : '0%');
        }
        if (options.includeDates) {
            row.push(item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A');
            row.push(item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A');
        }
        if (options.includePO) row.push(users.find(u => u.userId === team?.productOwnerUserId)?.username || 'N/A');
        if (options.includePM) row.push(users.find(u => u.userId === team?.projectManagerUserId)?.username || 'N/A');
        if (options.includeMembers) row.push(team?.users?.map(user => user.username).join(', ') || 'N/A');

        return row;
    });

    autoTable(doc, {
        startY: 40,
        head: [head],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
    });
    
    doc.save(`Custom_Project_Recap_${new Date().toISOString().split('T')[0]}.pdf`);
};