"use client";

import { useAppSelector } from '@/app/redux';
import Header from '@/components/Header';
import { ProjectStatus } from '@/state/api'; // Import your ProjectStatus enum/type
import { selectCurrentUser } from '@/state/authSlice';
import { 
    Clock, Edit, GitBranch, Grid3X3, List, Table, Search, Archive, History, 
    FileDown, Play, Check, XCircle, Zap, Power, CheckCircle, 
    ActivityIcon
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
                        <button onClick={() => onStatusChange('OnProgress')} className='flex items-center rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600'>
                            <Play className='mr-2 size-5' /> Start Project
                        </button>
                        {loggedInUser?.isAdmin && (
                            <button onClick={() => onStatusChange('Cancel')} className='flex items-center rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600'>
                                Cancel Project
                            </button>
                        )}
                    </>
                );
            case 'OnProgress':
            case 'Resolve':
                return (
                    <>
                        {status === 'Resolve' && loggedInUser?.isAdmin && (
                            <>
                                <button 
                                    onClick={() => onStatusChange('Finish')} 
                                    className='flex items-center rounded-md bg-green-500 px-3 py-2 text-white hover:bg-green-600'
                                >
                                    <CheckCircle className='mr-2 size-5' /> Finish Project
                                </button>
                            </>
                        )}
                        {loggedInUser?.isAdmin && (
                            <button onClick={() => onStatusChange('Cancel')} className='flex items-center rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600'>
                                Cancel Project
                            </button>
                        )}
                    </>
                );
            case 'Finish':
                 return (
                    <>
                        {loggedInUser?.isAdmin && (
                            <button onClick={onArchive} disabled={!isArchivable} className='flex items-center rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'>
                                <Archive className='mr-2 size-5' /> New Version
                            </button>
                        )}
                    </>
                );
            case 'Cancel':
                 return (
                    <>
                        {loggedInUser?.isAdmin && (
                            <button 
                                onClick={onArchive} 
                                disabled={!isArchivable} // 'isArchivable' is now powered by our new logic
                                title={isArchivable ? "Create a new version of this project" : ""}
                                className='flex items-center rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                            >
                                <Archive className='mr-2 size-5' /> New Version
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
        <div className='px-4 xl:px-6'>
            <div className='pb-6 pt-6 lg:pb-4 lg:pt-8'>
                <Header name={projectName}
                    buttonComponent={
                            <div className="flex items-center flex-wrap justify-end gap-2">
                                {renderActionButtons()}
                                <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-2"></div>
                                {loggedInUser?.isAdmin && (
                                    <>
                                        <button onClick={onEdit} className='flex items-center rounded-md bg-gray-500 px-3 py-2 text-white hover:bg-gray-600'><Edit className='mr-2 size-5' /> Edit</button>
                                        <button onClick={onExportPDF} className='flex items-center rounded-md bg-purple-600 px-3 py-2 text-white hover:bg-purple-700'><FileDown className='mr-2 size-5' /> Report</button>
                                    </>
                                )}
                                {docUrl && (
                                    <a href={docUrl} target="_blank" rel="noopener noreferrer" className='flex items-center rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700'>
                                        Document
                                    </a>
                                )}
                            </div>
                    }
                />
                <div className="mt-2 flex flex-wrap items-center space-x-4 text-sm gap-y-2">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-white text-xs font-semibold ${statusProps.color}`}>
                        {statusProps.icon}
                        <span>{statusProps.text}</span>
                    </div>
                    {/* Wrap adjacent conditionals in a fragment to fix ESLint error */}
                    <>
                        {teamName && (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Grid3X3 className="h-4 w-4" />
                                <span>Team: {teamName}</span>
                            </div>
                        )}
                        {ticketNumber && (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <List className="h-4 w-4" />
                                <span>Ticket: {ticketNumber}</span>
                            </div>
                        )}
                    </>
                    <p className='max-w-2xl text-gray-500 dark:text-gray-400'>{description || "No description."}</p>
                    {version != null && (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <GitBranch className="h-4 w-4" />
                            <span>Version {version}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className='flex flex-wrap-reverse gap-2 border-y border-gray-200 pb-[8px] pt-2 dark:border-stroke-dark md:items-center'>
                <div className='flex flex-1 items-center gap-2 md:gap-4'>
                    <TabButton name="Board" icon={<Grid3X3 className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                    <TabButton name="List" icon={<List className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                    <TabButton name="Timeline" icon={<Clock className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                    <TabButton name="Table" icon={<Table className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                    <TabButton name="Activity" icon={<ActivityIcon className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                    <TabButton name="History" icon={<History className='size-5' />} setActiveTab={setActiveTab} activeTab={activeTab} />
                </div>
                <div className='flex items-center gap-2'>
                    {activeTab !== 'History' && (
                        <div className='relative'>
                            <input 
                                type='text' 
                                placeholder='Search Task' 
                                className='rounded-md border py-1 pl-10 pr-4 focus:outline-none dark:border-dark-secondary dark:bg-dark-secondary dark:text-white'
                                value={localSearchTerm}
                                onChange={(e) => setLocalSearchTerm(e.target.value)}
                            />
                            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
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
            className={`relative flex items-center gap-2 px-1 py-2 text-gray-500 after:absolute after:-bottom-[9px] after:left-0 after:h-[1px] after:w-full hover:text-blue-600 dark:text-neutral-500 dark:hover:text-white sm:px-2 lg:px-4 ${
                isActive ? "text-blue-600 after:bg-blue-600 dark:text-white" : ""
            }`}
            onClick={() => setActiveTab(name)}
        >
            {icon}
            {name}
        </button>
    );
}

export default ProjectHeader;