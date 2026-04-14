"use client";

import { useAppSelector } from '@/app/redux';
import Header from '@/components/Header';
import { ProjectStatus } from '@/state/api'; // Import your ProjectStatus enum/type
import { selectCurrentUser } from '@/state/authSlice';
import {
    Clock, Edit, GitBranch, Grid3X3, List, Table, Search, Archive, History,
    FileDown, Play, Check, XCircle, Zap, Power, CheckCircle,
    ActivityIcon, Eye
} from 'lucide-react';
import React from 'react';

type Props = {
    activeTab: string;
    setActiveTab: (tabName: string) => void;
    projectName: string;
    description: string | undefined;
    version: number | undefined;
    status: ProjectStatus | string | undefined;
    isArchivable: boolean;
    localSearchTerm: string;
    setLocalSearchTerm: (term: string) => void;
    onEdit: () => void;
    onArchive: () => void;
    onExportPDF: () => void;
    onStatusChange: (newStatus: ProjectStatus | string) => void;
    docUrl?: string;
    teamName?: string;
    ticketNumber?: string;
}

// Helper to get style and icon for each status
const getStatusProps = (status: ProjectStatus | string | undefined) => {
    switch (status) {
        case 'Start':
            return { color: 'bg-gray-500', icon: <Power size={14} />, text: 'Start' };
        case 'OnProgress':
            return { color: 'bg-blue-500', icon: <Zap size={14} />, text: 'On Progress' };
        case 'Resolve':
            return { color: 'bg-yellow-500', icon: <Check size={14} />, text: 'Resolved' };
        case 'Finish':
            return { color: 'bg-green-500', icon: <CheckCircle size={14} />, text: 'Finished' };
        case 'Cancel':
            return { color: 'bg-red-500', icon: <XCircle size={14} />, text: 'Canceled' };
        default:
            return { color: 'bg-gray-400', icon: null, text: 'Unknown' };
    }
}

const ProjectHeader = ({ 
    activeTab, 
    setActiveTab, 
    projectName, 
    description, 
    version, 
    status,
    onEdit, 
    onArchive, 
    isArchivable, 
    localSearchTerm, 
    setLocalSearchTerm,
    onExportPDF,
    onStatusChange,
    docUrl,
    teamName,
    ticketNumber
}: Props) => {
    
    const statusProps = getStatusProps(status);

    // Conditionally render action buttons based on the current status
    const renderActionButtons = () => {
        switch (status) {
            case 'Start':
                return (
                    <>
                        <button onClick={() => onStatusChange('OnProgress')} className='flex items-center gap-1.5 rounded-lg bg-blue-primary px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-accent-600 transition-colors'>
                            <Play className='size-4' /> <span className="hidden sm:inline">Start Project</span><span className="sm:hidden">Start</span>
                        </button>
                        {loggedInUser?.role === 'ADMIN' && (
                            <button onClick={() => onStatusChange('Cancel')} className='flex items-center gap-1.5 rounded-lg bg-red-500 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-red-600 transition-colors'>
                                <span className="hidden sm:inline">Cancel Project</span><span className="sm:hidden">Cancel</span>
                            </button>
                        )}
                    </>
                );
            case 'OnProgress':
            case 'Resolve':
                return (
                    <>
                        {status === 'Resolve' && loggedInUser?.role === 'ADMIN' && (
                            <>
                                <button 
                                    onClick={() => onStatusChange('Finish')} 
                                    className='flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors'
                                >
                                    <CheckCircle className='size-4' /> Finish Project
                                </button>
                            </>
                        )}
                        {loggedInUser?.role === 'ADMIN' && (
                            <button onClick={() => onStatusChange('Cancel')} className='flex items-center gap-1.5 rounded-lg bg-red-500 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-red-600 transition-colors'>
                                <span className="hidden sm:inline">Cancel Project</span><span className="sm:hidden">Cancel</span>
                            </button>
                        )}
                    </>
                );
            case 'Finish':
                 return (
                    <>
                        {loggedInUser?.role === 'ADMIN' && (
                            <button onClick={onArchive} disabled={!isArchivable} className='flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                                <Archive className='size-4' /> <span className="hidden sm:inline">New Version</span><span className="sm:hidden">Version</span>
                            </button>
                        )}
                    </>
                );
            case 'Cancel':
                 return (
                    <>
                        {loggedInUser?.role === 'ADMIN' && (
                            <button 
                                onClick={onArchive} 
                                disabled={!isArchivable}
                                title={isArchivable ? "Create a new version of this project" : ""}
                                className='flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <Archive className='size-4' /> <span className="hidden sm:inline">New Version</span><span className="sm:hidden">Version</span>
                            </button>
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    const loggedInUser = useAppSelector(selectCurrentUser);
  
    return (
        <div className='px-2 sm:px-4 xl:px-6'>
            <div className='pb-4 pt-4 sm:pb-6 sm:pt-6 lg:pb-4 lg:pt-8'>
                <Header name={projectName}
                    buttonComponent={
                            <div className="flex items-center flex-wrap justify-end gap-1 sm:gap-2">
                                {loggedInUser?.role !== 'BUSINESS_OWNER' && (
                                    <>
                                        {renderActionButtons()}
                                        <div className="hidden sm:block h-6 border-l border-gray-300 dark:border-gray-600 mx-2"></div>
                                    </>
                                )}
                                {loggedInUser?.role === 'ADMIN' && (
                                    <>
                                        <button onClick={onEdit} className='flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-tertiary px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'><Edit className='size-4' /> <span className="hidden sm:inline">Edit</span></button>
                                        <button onClick={onExportPDF} className='flex items-center gap-1.5 rounded-lg bg-blue-primary px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-accent-600 transition-colors'><FileDown className='size-4' /> <span className="hidden sm:inline">Report</span></button>
                                    </>
                                )}
                                {docUrl && (
                                    <a href={docUrl} target="_blank" rel="noopener noreferrer" className='flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-tertiary px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'>
                                        <span className="hidden sm:inline">Document</span><span className="sm:hidden">Doc</span>
                                    </a>
                                )}
                            </div>
                    }
                />
                <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-white text-xs font-semibold ${statusProps.color}`}>
                            {statusProps.icon}
                            <span>{statusProps.text}</span>
                        </div>
                        {teamName && (
                            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-dark-tertiary px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <Grid3X3 className="h-3.5 w-3.5 text-gray-400" />
                                <span>{teamName}</span>
                            </div>
                        )}
                        {ticketNumber && (
                            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-dark-tertiary px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <List className="h-3.5 w-3.5 text-gray-400" />
                                <span>#{ticketNumber}</span>
                            </div>
                        )}
                        {version != null && (
                            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-dark-tertiary px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <GitBranch className="h-3.5 w-3.5 text-gray-400" />
                                <span>v{version}</span>
                            </div>
                        )}
                    </div>
                    {description && (
                        <p className='text-xs text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed'>{description}</p>
                    )}
                </div>
            </div>

            <div className='flex flex-wrap-reverse gap-x-0 gap-y-2 border-b border-gray-200 dark:border-stroke-dark md:items-center mt-1'>
                <div className='flex flex-1 items-center overflow-x-auto'>
                    {loggedInUser?.role !== 'DEVELOPER' && (
                        <TabButton name="Overview" icon={<Eye className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                    )}
                    {loggedInUser?.role !== 'BUSINESS_OWNER' && (
                        <>
                            <TabButton name="Board" icon={<Grid3X3 className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                            <TabButton name="List" icon={<List className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                            <TabButton name="Timeline" icon={<Clock className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                            <TabButton name="Table" icon={<Table className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                            <TabButton name="Activity" icon={<ActivityIcon className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                            <TabButton name="History" icon={<History className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                        </>
                    )}
                </div>
                <div className='flex items-center gap-2'>
                    {activeTab !== 'History' && activeTab !== 'Overview' && (
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Search tasks...'
                                className='rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-xs sm:text-sm w-36 sm:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:border-dark-tertiary dark:bg-dark-secondary dark:text-white transition-all'
                                value={localSearchTerm}
                                onChange={(e) => setLocalSearchTerm(e.target.value)}
                            />
                            <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

type TabButtonProps = {
    name: string;
    icon: React.ReactNode;
    setActiveTab: (tabName: string) => void;
    activeTab: string;
}

const TabButton = ({ name, icon, setActiveTab, activeTab }: TabButtonProps) => {
    const isActive = activeTab === name;

    return (
        <button
            className={`relative flex items-center gap-1 sm:gap-2 px-3 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
                isActive
                    ? "border-blue-primary text-blue-primary dark:border-accent-300 dark:text-accent-300 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
            }`}
            onClick={() => setActiveTab(name)}
        >
            {icon}
            <span className="hidden sm:inline">{name}</span>
        </button>
    );
}

export default ProjectHeader;