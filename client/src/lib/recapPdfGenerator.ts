import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task, Team, User } from '@/state/api';

export const exportAllProjectsToPDF = (
    projects: Project[], 
    allTasks: Task[],
    teams: Team[],
    users: User[]
) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    let finalY = 0;

    // --- Report Header ---
    doc.setFontSize(22);
    doc.text("All Projects Recap Report", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

    // --- Report Table ---
    const tableData = projects.map((project, index) => {
        const projectTasks = allTasks.filter(task => task.projectId === project.id && task.version === project.version);
        const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
        const progress = projectTasks.length > 0 ? `${Math.round((completedTasks / projectTasks.length) * 100)}%` : '0%';
        
        const team = teams.find(t => t.id === project.teamId);
        const pm = users.find(u => u.userId === team?.projectManagerUserId)?.username || 'N/A';
        const po = users.find(u => u.userId === team?.productOwnerUserId)?.username || 'N/A';
        const teamMembers = team?.users?.map(user => user.username).join(', ') || 'No members assigned';

        return [
            index + 1,
            project.id,
            project.name,
            project.status, // <-- ADDED Project Status
            `V${project.version}`,
            progress,
            project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A',
            project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A',
            po,
            pm,
            teamMembers,
        ];
    });

    autoTable(doc, {
        startY: 40,
        head: [['#', 'ID', 'Project', 'Status', 'Ver', 'Progress', 'Start', 'End', 'PO', 'PM', 'Team Members']], // <-- UPDATED Headers
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
        didDrawPage: (data) => {
            finalY = data.cursor?.y || 0;
        },
        columnStyles: {
            0: { cellWidth: 10 }, 
            1: { cellWidth: 10 }, 
            2: { cellWidth: 35 }, // Project Name
            3: { cellWidth: 25 }, // Status
            4: { cellWidth: 12 }, // Version
            5: { cellWidth: 20 }, // Progress
            10: { cellWidth: 55 }, // Team Members
        },
        // --- NEW: Add conditional coloring for the Status cell ---
        willDrawCell: (data) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                const status = data.cell.text[0];
                let color = [0, 0, 0]; // Default black
                if (status === 'Finish') color = [0, 0, 0]; // Forest Green
                if (status === 'Cancel') color = [0, 0, 0]; // Crimson Red
                if (status === 'OnProgress') color = [0, 0, 0]; // Blue
                doc.setTextColor(color[0], color[1], color[2]);
            }
        },
    });

    // --- Summary Section ---
    const totalProjects = projects.length;
    const totalTasks = allTasks.filter(task => projects.some(p => p.id === task.projectId && p.version === task.version)).length;
    const totalCompletedTasks = allTasks.filter(task => task.status === 'Completed' && projects.some(p => p.id === task.projectId && p.version === task.version)).length;
    const overallProgress = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;
    
    let summaryY = finalY + 15;
    if (summaryY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        summaryY = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(220, 220, 220);
    doc.rect(14, summaryY, doc.internal.pageSize.getWidth() - 28, 24, 'FD');

    summaryY += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Overall Summary", 20, summaryY);
    summaryY += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Active Projects: ${totalProjects}`, 20, summaryY);
    doc.text(`Total Tasks: ${totalTasks}`, 100, summaryY);
    doc.text(`Overall Completion: ${overallProgress}%`, 180, summaryY);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const uniqueId = Math.random().toString(36).substring(2, 7);
    doc.save(`Projects_Recap_${dateStr}_${uniqueId}.pdf`);
};