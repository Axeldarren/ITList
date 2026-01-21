import React, { useState } from 'react';
import { Project, ProjectStatus, ProjectVersion } from '@/state/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Clock, History } from 'lucide-react';

type Props = {
    project: Project;
    versions: ProjectVersion[];
};

// Helper to get the badge color based on status
const getStatusBadgeColor = (status: ProjectStatus | string | undefined) => {
    switch (status) {
        case 'OnProgress': return 'bg-blue-500';
        case 'Resolve': return 'bg-yellow-500';
        case 'Finish': return 'bg-green-500';
        case 'Cancel': return 'bg-red-500';
        case 'Start':
        default:
            return 'bg-gray-500';
    }
};

const ProjectLifecycleRow = ({ project, versions }: Props) => {
    const router = useRouter();
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    const handleProjectClick = () => {
        router.push(`/projects/${project.id}`);
    };
    
    // Sort versions by version number descending (newest first)
    // Create a pseudo-version for the current active state
    const activeVersion = {
        id: -1, // Temporary ID for display
        version: project.version,
        name: project.name,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        status: project.status,
        projectId: project.id,
        archivedAt: '' // Current version is not archived
    } as ProjectVersion;

    const allVersions = [activeVersion, ...versions].sort((a, b) => b.version - a.version);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-secondary rounded-lg shadow-sm border border-gray-100 dark:border-dark-tertiary hover:shadow-md transition-shadow duration-300">
            {/* Project Header (Active Version) */}
            <div className="p-5 flex-1 cursor-pointer" onClick={handleProjectClick}>
                <div className="flex justify-between items-start mb-2">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold text-white rounded-full ${getStatusBadgeColor(project.status)}`}>
                        {project.status}
                    </span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-tertiary px-2 py-1 rounded">
                        V{project.version}
                    </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2" title={project.name}>
                    {project.name}
                </h3>
                
                {project.startDate && project.endDate && (
                     <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-3">
                        <Clock size={14} />
                        <span>{format(new Date(project.startDate), "MMM d, yyyy")}</span>
                        <span>-</span>
                        <span>{format(new Date(project.endDate), "MMM d, yyyy")}</span>
                    </div>
                )}
            </div>

            {/* History Toggle & Section */}
            {allVersions.length > 0 && (
                <div className="border-t border-gray-100 dark:border-dark-tertiary">
                    <button 
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                        className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <History size={14} />
                            <span>Version History ({allVersions.length})</span>
                        </div>
                        {isHistoryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    
                    {isHistoryExpanded && (
                        <div className="px-5 pb-4 space-y-3 bg-gray-50/50 dark:bg-white/5 animate-in slide-in-from-top-2 duration-200">
                            {allVersions.map((version) => (
                                <div key={version.id} className="relative pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">V{version.version}</span>
                                            {version.id === -1 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${getStatusBadgeColor(version.status)}`}>
                                            {version.status}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-500">
                                        {format(new Date(version.startDate), "MMM d")} - {format(new Date(version.endDate), "MMM d, yyyy")}
                                    </div>
                                    {version.archivedAt && (
                                        <div className="text-[10px] text-gray-400 mt-0.5 italic">
                                            Archived: {format(new Date(version.archivedAt), "MMM d")}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectLifecycleRow;