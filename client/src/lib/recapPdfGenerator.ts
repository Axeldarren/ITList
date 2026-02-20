import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, ProjectVersion, Task, Team, User, ProductMaintenance } from '@/state/api';

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
    includeProducts?: boolean; // NEW: Option to include product maintenance overview
};

export const exportAllProjectsToPDF = (
    reportItems: (Project | ProjectVersion)[],
    allTasks: Task[],
    teams: Team[],
    users: User[],
    options: ReportOptions,
    signatures?: SignatureInfo[],
    productMaintenances?: ProductMaintenance[]
) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Professional header
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Project Portfolio Recap', pageWidth / 2, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
    // subtle divider under header
    doc.setDrawColor(200);
    doc.setLineWidth(0.4);
    doc.line(14, 34, pageWidth - 14, 34);

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
    if (options.includePO) head.push('BO');
    if (options.includePM) head.push('PM');
    if (options.includeMembers) head.push('Team Members');

    // Build quick lookup for maintenance linkage
    const maintainedProjectIds = new Set<number>();
    const maintenanceByProject = new Map<number, ProductMaintenance[]>();
    if (options.includeProducts && productMaintenances && productMaintenances.length > 0) {
        for (const pm of productMaintenances) {
            if (pm.projectId) {
                maintainedProjectIds.add(pm.projectId);
                const arr = maintenanceByProject.get(pm.projectId) || [];
                arr.push(pm);
                maintenanceByProject.set(pm.projectId, arr);
            }
        }
    }

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
        if (options.includePO) row.push(users.find(u => u.userId === (item as Project).productOwnerUserId)?.username || 'N/A');
        if (options.includePM) row.push(users.find(u => u.userId === team?.projectManagerUserId)?.username || 'N/A');
    if (options.includeMembers) row.push(team?.users?.map(user => user.username).join(', ') || 'N/A');

        return row;
    });

    autoTable(doc, {
        startY: summaryY,
        head: [head],
        body: body,
        theme: 'grid',
    headStyles: { fillColor: [22, 160, 133], halign: 'center' },
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

    // Optional: Maintenance overview sections
    if (options.includeProducts) {
        const docWithTable = doc as jsPDF & { lastAutoTable: { finalY: number } };
        let y = docWithTable.lastAutoTable?.finalY ? docWithTable.lastAutoTable.finalY + 10 : 40;

        const finishedMaintained = reportItems.filter(p => p.status === 'Finish' && maintainedProjectIds.has(p.id));
        const finishedNotMaintained = reportItems.filter(p => p.status === 'Finish' && !maintainedProjectIds.has(p.id));

        doc.setFontSize(12);
        doc.text('Maintenance Overview', 14, y);
        y += 6;

        // Finished & Maintained
        if (finishedMaintained.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Finished & Maintained Projects', 'Linked Products']],
                body: finishedMaintained.map(p => [
                    `${p.name} (ID: ${p.id})`,
                    (maintenanceByProject.get(p.id) || []).map(pm => pm.name).join(', ') || '—'
                ]),
                theme: 'striped',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [46, 204, 113] },
            });
            y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        }

        // Finished but Not Maintained
        if (finishedNotMaintained.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Finished but Not Maintained Projects']],
                body: finishedNotMaintained.map(p => [ `${p.name} (ID: ${p.id})` ]),
                theme: 'striped',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [241, 196, 15] },
            });
            y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        }

    // Products table
        if (productMaintenances && productMaintenances.length > 0) {
            autoTable(doc, {
                startY: y,
        head: [['Product', 'Status']],
        body: productMaintenances.map(pm => [ pm.name, pm.status ]),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [52, 152, 219], halign: 'center' },
            });
        }
    }
    
    // --- Signatures Section ---
    if (signatures && signatures.length > 0) {
        // Add signatures with proper spacing after the last table and ensure pagination
        const docWithTable = doc as jsPDF & { lastAutoTable: { finalY: number } };
        let y = docWithTable.lastAutoTable?.finalY ? docWithTable.lastAutoTable.finalY + 20 : 40;
        const pageHeight = doc.internal.pageSize.getHeight?.() ?? (doc.internal.pageSize as { height: number }).height;
        const titleHeight = 30;      // height consumed after printing the title
        const rowHeight = 40;        // vertical space used per signature row (2 signatures)
        const bottomPadding = 20;    // keep a little breathing room at the bottom

        // If the title + at least one row cannot fit on the current page, move to the next page
        if (y + titleHeight + rowHeight > pageHeight - bottomPadding) {
            doc.addPage();
            y = 40;
        }

        // Title
        doc.setFontSize(16);
        doc.text('Required Signatures', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += titleHeight;

        // Left and right layout (2 columns) - perfectly centered
        for (let i = 0; i < signatures.length; i += 2) {
            // If next row would overflow, add a new page and reprint the section title
            if (y + rowHeight > pageHeight - bottomPadding) {
                doc.addPage();
                y = 40;
                doc.setFontSize(16);
                doc.text('Required Signatures', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                y += titleHeight;
            }

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
            
            y += 40; // Spacing between signature rows
        }
    }
    
    // Unique id for filename for easier traceability
    // 7-char ID: last 2 of timestamp base36 + 5 random base36 chars
    const uniqueId = (
        Date.now().toString(36).slice(-2) + Math.random().toString(36).slice(2, 7)
    ).toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Project_Recap_${dateStr}_${uniqueId}.pdf`);
};