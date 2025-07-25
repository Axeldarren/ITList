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

    // --- NEW: Dynamic Title ---
    doc.setFontSize(20);
    doc.text(`Developer Productivity Report: ${monthName}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = stats.map(s => [
        s.username,
        s.totalTasks,
        s.completedTasks,
        s.overdueTasks,
        formatDuration(s.totalTimeLogged),
    ]);

    autoTable(doc, {
        startY: 40,
        head: [['Developer', 'Total Tasks', 'Completed', 'Overdue', 'Time Logged']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Developer_Productivity_${month}.pdf`);
};