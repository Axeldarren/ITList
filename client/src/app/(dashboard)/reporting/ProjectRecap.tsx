"use client";

import React, { useState, useMemo } from 'react';
import { useGetProjectsQuery, useGetAllProjectVersionsQuery, useGetTeamsQuery, useGetUsersQuery, useGetAllTasksQuery, useGetProductMaintenancesQuery, ProjectStatus } from '@/state/api';
import { exportAllProjectsToPDF, ReportOptions, SignatureInfo } from '@/lib/recapPdfGenerator';
import ModalRecapSignatureSelect from '@/components/ModalRecapSignatureSelect';
import { FileDown, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper to get all enum values for the status checkboxes
const projectStatuses = Object.values(ProjectStatus);

const ProjectRecap = () => {
    // Data fetching hooks
    const { data: projects = [], isLoading: pLoading } = useGetProjectsQuery();
    const { data: allVersions = [], isLoading: vLoading } = useGetAllProjectVersionsQuery();
    const { data: allTasks = [], isLoading: tLoading } = useGetAllTasksQuery();
    const { data: teams = [], isLoading: mLoading } = useGetTeamsQuery();
    const { data: users = [], isLoading: uLoading } = useGetUsersQuery();
    const { data: productMaintenances = [], isLoading: pmLoading } = useGetProductMaintenancesQuery();

    // State for advanced filters
    const [includeArchived, setIncludeArchived] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(projectStatuses);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // State for column customization
    const [options, setOptions] = useState<ReportOptions>({
        includeId: true,
        includeVersion: true,
        includeStatus: true,
        includeProgress: true,
        includeStoryPoints: true,
        includeDates: true,
        includePO: true,
        includePM: true,
    includeMembers: true,
    includeProducts: false,
    });

    const handleOptionChange = (option: keyof ReportOptions) => {
        setOptions(prev => ({ ...prev, [option]: !prev[option] }));
    };
    
    const handleStatusChange = (status: string) => {
        setSelectedStatuses(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const filteredReportData = useMemo(() => {
        // Ensure we're working with the correct types
        let reportItems = [...projects.filter(p => !p.deletedAt)];

        if (includeArchived) {
            reportItems = [...reportItems, ...allVersions];
        }

        let byStatus = reportItems.filter(item => selectedStatuses.includes(item.status));

        if (dateRange.start && dateRange.end) {
            const rangeStart = new Date(dateRange.start);
            const rangeEnd = new Date(dateRange.end);
            rangeEnd.setHours(23, 59, 59, 999); // Ensure the end date is inclusive

            byStatus = byStatus.filter(item => {
                if (!item.startDate || !item.endDate) return false;
                const itemStart = new Date(item.startDate);
                const itemEnd = new Date(item.endDate);
                return itemStart <= rangeEnd && itemEnd >= rangeStart;
            });
        }
        
        return byStatus;
    }, [projects, allVersions, includeArchived, selectedStatuses, dateRange]);

    // Calculate summary totals
    const summaryTotals = useMemo(() => {
        let totalStoryPoints = 0;

        filteredReportData.forEach(item => {
            const projectTasks = allTasks.filter(task => task.projectId === item.id && task.version === item.version);
            
            totalStoryPoints += projectTasks.reduce((sum, task) => sum + (task.points || 0), 0);
        });

        return { totalStoryPoints };
    }, [filteredReportData, allTasks]);

    const handleExport = () => {
        if (filteredReportData.length === 0) {
            toast.error("No projects match the selected filters.");
            return;
        }
        setIsSignatureModalOpen(true);
    };

    const handleExportWithSignatures = (signatures: SignatureInfo[]) => {
        exportAllProjectsToPDF(filteredReportData, allTasks, teams, users, options, signatures, productMaintenances);
        toast.success("Project recap report generated successfully!");
    };
    
    const isLoading = pLoading || vLoading || tLoading || mLoading || uLoading || pmLoading;

    const OptionCheckbox = ({ id, label }: { id: keyof ReportOptions, label: string }) => (
        <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer">
            <input 
                id={id}
                type="checkbox"
                checked={options[id]}
                onChange={() => handleOptionChange(id)}
                className="h-4 w-4 rounded text-blue-primary focus:ring-blue-primary"
            />
            <span className="text-gray-700 dark:text-gray-200">{label}</span>
        </label>
    );
    
    const inputClass = "w-full rounded border p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white";

    return (
        <div className="p-6 bg-white rounded-lg shadow dark:bg-dark-secondary">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Project Recap Report</h2>
            
            <div className="p-4 border rounded-md mb-6 dark:border-dark-tertiary">
                <h3 className="font-semibold mb-3 dark:text-gray-200">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Include Statuses</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {projectStatuses.map(status => (
                                <label key={status} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => handleStatusChange(status)} className="h-4 w-4 rounded"/>
                                    <span className="dark:text-gray-300">{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Date Range</label>
                            <div className="flex items-center gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className={inputClass} />
                                <span className="dark:text-gray-300">to</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className={inputClass} />
                            </div>
                        </div>
                        <label className="flex items-center space-x-2 cursor-pointer pt-2">
                            <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} className="h-4 w-4 rounded"/>
                            <span className="dark:text-gray-300">Include Previous/Archived Versions</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="p-4 border rounded-md mb-8 dark:border-dark-tertiary">
                <h3 className="font-semibold mb-3 dark:text-gray-200 flex items-center gap-2"><Settings size={18} /> Report Columns</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <OptionCheckbox id="includeId" label="Project ID" />
                    <OptionCheckbox id="includeVersion" label="Version" />
                    <OptionCheckbox id="includeStatus" label="Status" />
                    <OptionCheckbox id="includeProgress" label="Progress" />
                    <OptionCheckbox id="includeStoryPoints" label="Story Points" />
                    <OptionCheckbox id="includeDates" label="Start/End Dates" />
                    <OptionCheckbox id="includePO" label="Product Owner" />
                    <OptionCheckbox id="includePM" label="Project Manager" />
                    <OptionCheckbox id="includeMembers" label="Team Members" />
                    <OptionCheckbox id="includeProducts" label="Include Products/Maintenance" />
                </div>
            </div>

            {/* Summary Preview */}
            {!isLoading && filteredReportData.length > 0 && options.includeStoryPoints && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-6 border border-green-200 dark:border-gray-600">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Report Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{filteredReportData.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                        </div>
                        {options.includeStoryPoints && (
                            <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{summaryTotals.totalStoryPoints}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Story Points</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button 
                onClick={handleExport}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-purple-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
                <FileDown size={20} />
                {isLoading ? "Loading Data..." : `Generate Report (${filteredReportData.length} Projects${options.includeProducts ? `, ${productMaintenances.length} Products` : ''})`}
            </button>

            <ModalRecapSignatureSelect
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onConfirm={handleExportWithSignatures}
                users={users}
            />
        </div>
    );
};

export default ProjectRecap;