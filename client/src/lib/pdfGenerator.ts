import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task, User } from '@/state/api';

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
    developers: User[]
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
            ['Start Date', project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'],
            ['End Date', project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'],
            ['Project Manager (PM)', projectManager?.username || 'N/A'],
            ['Product Owner (PO)', productOwner?.username || 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // --- Progress Bar ---
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
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

    autoTable(doc, {
        startY: y,
        head: [['#', 'Title', 'Status', 'Assignee', 'Priority']],
        body: tasks.map((task, index) => [
            index + 1,
            task.title || '',
            task.status || '',
            task.assignee?.username || 'Unassigned',
            task.priority || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    
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

    // --- Save the PDF ---
    const dateStr = new Date().toISOString().split('T')[0];
    const uniqueId = Math.random().toString(36).substring(2, 7);
    doc.save(`Project_Report_${project.name.replace(/\s/g, '_')}_V${project.version}_${dateStr}_${uniqueId}.pdf`);
};