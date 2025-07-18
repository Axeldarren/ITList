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

        // --- NEW: Get team member names ---
        const teamMembers = team?.users?.map(user => user.username).join(', ') || 'No members assigned';

        return [
            index + 1, // <-- Indexing
            project.id, // <-- Project ID
            project.name,
            `V${project.version}`,
            progress,
            project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A',
            project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A',
            po,
            pm,
            teamMembers, // <-- Team Members
        ];
    });

    autoTable(doc, {
        startY: 40,
        head: [['#', 'ID', 'Project', 'Ver', 'Progress', 'Start', 'End', 'PO', 'PM', 'Team Members']], // <-- Updated Headers
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
        didDrawPage: (data) => {
            finalY = data.cursor?.y || 0;
        },
        columnStyles: {
            // Adjust column widths to fit new content
            0: { cellWidth: 10 }, // Index
            1: { cellWidth: 10 }, // ID
            2: { cellWidth: 40 }, // Project Name
            3: { cellWidth: 12 }, // Version
            4: { cellWidth: 20 }, // Progress
            9: { cellWidth: 60 }, // Team Members
        }
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