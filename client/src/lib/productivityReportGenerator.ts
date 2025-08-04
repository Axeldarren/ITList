import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DeveloperStats } from '@/state/api';
import { format, parseISO } from 'date-fns';

const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 60) return `0m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return [ h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '' ].filter(Boolean).join(' ');
};

export const exportProductivityToPDF = (stats: DeveloperStats[], month: string) => {
    const doc = new jsPDF();
    const monthName = format(parseISO(`${month}-01`), 'MMMM yyyy');

    // Title and Header
    doc.setFontSize(20);
    doc.text(`Developer Productivity Report: ${monthName}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Calculate totals for summary
    const totalTimeLogged = stats.reduce((sum, s) => sum + s.totalTimeLogged, 0);
    const totalCompletedTasks = stats.reduce((sum, s) => sum + s.completedTasks, 0);

    // Summary Section
    doc.setFontSize(14);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Time Logged: ${formatDuration(totalTimeLogged)}`, 14, 52);
    doc.text(`Total Tasks Completed: ${totalCompletedTasks}`, 14, 58);

    // Developer Details Table
    const tableData = stats.map(s => [
        s.username,
        formatDuration(s.totalTimeLogged),
        s.completedTasks,
        s.overdueTasks,
    ]);

    autoTable(doc, {
        startY: 70,
        head: [['Developer', 'Time Logged', 'Tasks Completed', 'Overdue']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
            1: { halign: 'center' }, // Time Logged
            2: { halign: 'center' }, // Tasks Completed
            3: { halign: 'center' }, // Overdue
        }
    });

    doc.save(`Developer_Productivity_${month}.pdf`);
};