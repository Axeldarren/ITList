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
    const { data: productMaintenanceData, isLoading: pmLoading } = useGetProductMaintenancesQuery({ page: 1, limit: 1000 });
    const productMaintenances = productMaintenanceData?.data || [];

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
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Project Recap Report</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Generate comprehensive PDF reports of your projects</p>
                </div>
            </div>
            
            {/* Filters Section */}
            <div className="rounded-2xl border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60">
                <h3 className="text-lg font-semibold mb-5 dark:text-gray-200 flex items-center gap-2">Filters</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Include Statuses</label>
                        <div className="flex flex-wrap gap-3">
                            {projectStatuses.map(status => (
                                <label key={status} className={`flex items-center px-4 py-2 cursor-pointer transition-all duration-200 rounded-xl border ${selectedStatuses.includes(status) ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-dark-bg dark:border-white/5 dark:text-gray-400 dark:hover:bg-dark-tertiary'}`}>
                                    <input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => handleStatusChange(status)} className="sr-only"/>
                                    <span className="text-sm font-medium">{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Date Range</label>
                            <div className="flex items-center gap-3">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-dark-bg/50 dark:text-gray-200 transition-colors" />
                                <span className="text-gray-400 font-medium">to</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-dark-bg/50 dark:text-gray-200 transition-colors" />
                            </div>
                        </div>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500"/>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">Include Previous/Archived Versions</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Report Columns Section */}
            <div className="rounded-2xl border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-dark-secondary/60">
                <h3 className="text-lg font-semibold mb-5 dark:text-gray-200 flex items-center gap-2"><Settings size={18} className="text-gray-400" /> Report Columns</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-6">
                    <OptionCheckbox id="includeId" label="Project ID" />
                    <OptionCheckbox id="includeVersion" label="Version" />
                    <OptionCheckbox id="includeStatus" label="Status" />
                    <OptionCheckbox id="includeProgress" label="Progress" />
                    <OptionCheckbox id="includeStoryPoints" label="Story Points" />
                    <OptionCheckbox id="includeDates" label="Start/End Dates" />
                    <OptionCheckbox id="includePO" label="Business Owner" />
                    <OptionCheckbox id="includePM" label="Project Manager" />
                    <OptionCheckbox id="includeMembers" label="Team Members" />
                    <OptionCheckbox id="includeProducts" label="Products/Maintenance" />
                </div>
            </div>

            {/* Summary Preview */}
            {!isLoading && filteredReportData.length > 0 && options.includeStoryPoints && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 shadow-sm dark:border-blue-900/30 dark:from-blue-900/20 dark:to-indigo-900/10">
                        <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Total Projects Selected</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{filteredReportData.length}</p>
                    </div>
                    {options.includeStoryPoints && (
                        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50/50 p-6 shadow-sm dark:border-indigo-900/30 dark:from-indigo-900/20 dark:to-purple-900/10">
                            <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Total Story Points</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{summaryTotals.totalStoryPoints}</p>
                        </div>
                    )}
                </div>
            )}

            <button 
                onClick={handleExport}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-gradient-to-r hover:from-purple-700 hover:to-indigo-700 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none"
            >
                <FileDown size={20} />
                {isLoading ? "Loading Data..." : `Generate PDF Report (${filteredReportData.length} Projects${options.includeProducts ? `, ${productMaintenances.length} Products` : ''})`}
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