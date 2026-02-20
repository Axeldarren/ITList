import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task, User } from '@/state/api';

export interface SignatureInfo {
    user: User;
    role: string;
}

// Helper function to add a header to each page
const addHeader = (doc: jsPDF, project: Project) => {
    doc.setFontSize(20);
    doc.text(`Project Report: ${project.name}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Version: ${project.version}`, 14, 30);
    doc.setFontSize(8);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 36);
};

export const exportProjectToPDF = (
    project: Project, 
    tasks: Task[], 
    projectManager: User | undefined, 
    productOwner: User | undefined, 
    developers: User[],
    signatures?: SignatureInfo[]
) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let y = 45; // Initial y position after header

    addHeader(doc, project);

    // --- Project Details Section ---
    autoTable(doc, {
        startY: y,
        head: [['Detail', 'Information']],
        body: [
            ['Project ID', `${project.id}`],
            ['Status', project.status], // <-- THIS IS THE FIX
            ['Start Date', project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'],
            ['End Date', project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'],
            ['Project Manager (PM)', projectManager?.username || 'N/A'],
            ['Business Owner (BO)', productOwner?.username || 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // --- Progress Bar ---
    const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;
    
    doc.setFontSize(10);
    doc.text('Overall Progress', 14, y);
    y += 5;
    doc.setDrawColor(150);
    doc.rect(14, y, 182, 8, 'D'); // Border
    doc.setFillColor(70, 130, 180);
    doc.rect(15, y + 0.5, 180 * (progress / 100), 7, 'F'); // Filled progress
    doc.setTextColor(255, 255, 255);
    // Calculate the exact center of the progress bar
    const progressBarWidth = 180;
    const progressBarCenterX = 14 + progressBarWidth / 2;
    doc.setTextColor(0, 0, 0); 
    doc.text(`${progress}%`, progressBarCenterX, y + 5.5, { align: 'center' });
    y += 15;

    // --- Task List Section ---
    if (y > pageHeight - 40) { // Check for page break
        doc.addPage();
        addHeader(doc, project);
        y = 45;
    }

    doc.setFontSize(14);
    doc.text('Task Summary', 14, y);
    y += 8;

    // Separate tasks by status
    const todoTasks = tasks.filter(task => task.status === 'To Do');
    const inProgressTasks = tasks.filter(task => task.status === 'Work In Progress');
    const underReviewTasks = tasks.filter(task => task.status === 'Under Review');
    const completedTasks = tasks.filter(task => task.status === 'Completed');

    // --- To Do Tasks ---
    if (todoTasks.length > 0) {
        doc.setFontSize(12);
        doc.text('To Do Tasks', 14, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['#', 'Title', 'Assignee', 'Priority']],
            body: todoTasks.map((task, index) => [
                index + 1,
                task.title || '',
                task.assignee?.username || 'Unassigned',
                task.priority || ''
            ]),
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] }, // Red for To Do
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // --- Work In Progress Tasks ---
    if (inProgressTasks.length > 0) {
        if (y > pageHeight - 40) { // Check for page break
            doc.addPage();
            addHeader(doc, project);
            y = 45;
        }

        doc.setFontSize(12);
        doc.text('Work In Progress Tasks', 14, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['#', 'Title', 'Assignee', 'Priority']],
            body: inProgressTasks.map((task, index) => [
                index + 1,
                task.title || '',
                task.assignee?.username || 'Unassigned',
                task.priority || ''
            ]),
            theme: 'grid',
            headStyles: { fillColor: [241, 196, 15] }, // Yellow for In Progress
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // --- Under Review Tasks ---
    if (underReviewTasks.length > 0) {
        if (y > pageHeight - 40) { // Check for page break
            doc.addPage();
            addHeader(doc, project);
            y = 45;
        }

        doc.setFontSize(12);
        doc.text('Under Review Tasks', 14, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['#', 'Title', 'Assignee', 'Priority']],
            body: underReviewTasks.map((task, index) => [
                index + 1,
                task.title || '',
                task.assignee?.username || 'Unassigned',
                task.priority || ''
            ]),
            theme: 'grid',
            headStyles: { fillColor: [155, 89, 182] }, // Purple for Under Review
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // --- Completed Tasks ---
    if (completedTasks.length > 0) {
        if (y > pageHeight - 40) { // Check for page break
            doc.addPage();
            addHeader(doc, project);
            y = 45;
        }

        doc.setFontSize(12);
        doc.text('Completed Tasks', 14, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['#', 'Title', 'Assignee', 'Priority', 'Completed Date']],
            body: completedTasks.map((task, index) => [
                index + 1,
                task.title || '',
                task.assignee?.username || 'Unassigned',
                task.priority || '',
                task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'N/A'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [46, 204, 113] }, // Green for Completed
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
    
    // --- Developers Involved Section ---
     if (y > pageHeight - 40) { // Check for page break
        doc.addPage();
        addHeader(doc, project);
        y = 45;
    }

    doc.setFontSize(14);
    doc.text('Team Members Involved', 14, y);
    y += 8;
    
    const devNames = developers.map(dev => dev.username).join(', ');
    doc.setFontSize(10);
    doc.text(devNames, 14, y, { maxWidth: 180 });
    y += 15;

    // --- Signatures Section ---
    if (signatures && signatures.length > 0) {
        // Add signatures immediately after content, no gap
        y += 10;

        doc.setFontSize(14);
        doc.text('Required Signatures', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 15;

        // Left and right layout (2 columns) - centered
        for (let i = 0; i < signatures.length; i += 2) {
            const leftSignature = signatures[i];
            const rightSignature = signatures[i + 1];
            
            // Calculate center positions
            const pageWidth = doc.internal.pageSize.getWidth();
            const centerX = pageWidth / 2;
            const leftX = centerX + 30;  // Left signature very close to center
            const rightX = centerX + 200; // Right signature super right
            
            // Left signature
            if (leftSignature) {
                // Signature line
                doc.setLineWidth(0.3); // Thinner line
                doc.line(leftX, y, leftX + 70, y);
                
                // Labels below with date next to name
                doc.setFontSize(9); // Smaller, less bold text
                const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
                doc.text(`${leftSignature.user.username}  ${currentDate}`, leftX, y + 8);
                doc.text(leftSignature.role, leftX, y + 16);
            }
            
            // Right signature
            if (rightSignature) {
                // Signature line
                doc.setLineWidth(0.3); // Thinner line
                doc.line(rightX, y, rightX + 70, y);
                
                // Labels below with date next to name
                doc.setFontSize(9); // Smaller, less bold text
                const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
                doc.text(`${rightSignature.user.username}  ${currentDate}`, rightX, y + 8);
                doc.text(rightSignature.role, rightX, y + 16);
            }
            
            y += 30; // Move to next row after every 2 signatures
        }
    }

    // --- Save the PDF ---
    const dateStr = new Date().toISOString().split('T')[0];
    const uniqueId = Math.random().toString(36).substring(2, 7);
    doc.save(`Project_Report_${project.name.replace(/\s/g, '_')}_V${project.version}_${dateStr}_${uniqueId}.pdf`);
};