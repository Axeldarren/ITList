import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, ProjectVersion, Task, Team, User } from '@/state/api';

export interface SignatureInfo {
    user: User;
    role: 'IT Division Head' | 'IT Department Head';
}

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
    includeStoryPoints: boolean; // NEW: Option to include total story points
};

export const exportAllProjectsToPDF = (
    reportItems: (Project | ProjectVersion)[], 
    allTasks: Task[],
    teams: Team[],
    users: User[],
    options: ReportOptions,
    signatures?: SignatureInfo[]
) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(22);
    doc.text("All Projects Recap Report", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

    // Calculate overall summary if story points are included
    let summaryY = 40;
    if (options.includeStoryPoints) {
        let totalStoryPoints = 0;

        reportItems.forEach(item => {
            const projectTasks = allTasks.filter(task => task.projectId === item.id && task.version === item.version);
            
            if (options.includeStoryPoints) {
                totalStoryPoints += projectTasks.reduce((sum, task) => sum + (task.points || 0), 0);
            }
        });

        // Summary section
        doc.setFontSize(14);
        doc.text('Project Portfolio Summary', 14, summaryY + 5);
        doc.setFontSize(10);
        
        let summaryText = `Total Projects: ${reportItems.length}`;
        if (options.includeStoryPoints) {
            summaryText += ` | Total Story Points Across All Projects: ${totalStoryPoints}`;
        }
        
        doc.text(summaryText, 14, summaryY + 12);
        summaryY += 25;
    }

    const head: string[] = ['#', 'Project'];
    if (options.includeId) head.push('ID');
    if (options.includeStatus) head.push('Status');
    if (options.includeVersion) head.push('Ver');
    if (options.includeProgress) head.push('Progress');
    if (options.includeStoryPoints) head.push('Total Story Points');
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
        const projectTasks = allTasks.filter(task => task.projectId === item.id && task.version === item.version);
        
        if (options.includeId) row.push(item.id);
        if (options.includeStatus) row.push(item.status);
        if (options.includeVersion) row.push(`V${item.version}`);
        if (options.includeProgress) {
            const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
            row.push(projectTasks.length > 0 ? `${Math.round((completedTasks / projectTasks.length) * 100)}%` : '0%');
        }
        if (options.includeStoryPoints) {
            // Calculate total story points for this project (all tasks, regardless of completion status)
            const totalStoryPoints = projectTasks.reduce((sum, task) => sum + (task.points || 0), 0);
            row.push(totalStoryPoints);
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
        startY: summaryY,
        head: [head],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
        columnStyles: {
            // Center align numeric columns
            0: { halign: 'center' }, // #
            ...(options.includeId && { [head.indexOf('ID')]: { halign: 'center' } }),
            ...(options.includeStoryPoints && { [head.indexOf('Total Story Points')]: { halign: 'center' } }),
            ...(options.includeProgress && { [head.indexOf('Progress')]: { halign: 'center' } }),
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
        }
    });
    
    // --- Signatures Section ---
    if (signatures && signatures.length > 0) {
        // Add signatures with proper spacing after the table
        const docWithTable = doc as jsPDF & { lastAutoTable: { finalY: number } };
        let y = docWithTable.lastAutoTable?.finalY ? docWithTable.lastAutoTable.finalY + 20 : 40;
        
        // Title with more spacing
        doc.setFontSize(16);
        doc.text('Required Signatures', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 30; // Increased spacing between title and signature boxes
        
        // Left and right layout (2 columns) - perfectly centered
        for (let i = 0; i < signatures.length; i += 2) {
            const leftSignature = signatures[i];
            const rightSignature = signatures[i + 1];
            
            // Calculate center positions for landscape format with better spacing
            const pageWidth = doc.internal.pageSize.getWidth();
            const centerX = pageWidth / 2;
            const signatureWidth = 80;
            const gapBetweenSignatures = 40; // Space between left and right signatures
            
            const leftX = centerX - signatureWidth - (gapBetweenSignatures / 2);  // Left signature centered
            const rightX = centerX + (gapBetweenSignatures / 2);  // Right signature centered
            
            // Left signature
            if (leftSignature) {
                // Signature line
                doc.setLineWidth(0.3);
                doc.line(leftX, y, leftX + signatureWidth, y);
                
                // Labels below with date next to name
                doc.setFontSize(9);
                const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
                doc.text(`${leftSignature.user.username}  ${currentDate}`, leftX, y + 8);
                doc.text(leftSignature.role, leftX, y + 16);
            }
            
            // Right signature
            if (rightSignature) {
                // Signature line
                doc.setLineWidth(0.3);
                doc.line(rightX, y, rightX + signatureWidth, y);
                
                // Labels below with date next to name
                doc.setFontSize(9);
                const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
                doc.text(`${rightSignature.user.username}  ${currentDate}`, rightX, y + 8);
                doc.text(rightSignature.role, rightX, y + 16);
            }
            
            y += 40; // Increased spacing between signature rows
        }
    }
    
    doc.save(`Custom_Project_Recap_${new Date().toISOString().split('T')[0]}.pdf`);
};