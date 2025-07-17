"use client";

import React, { use, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

// Component Imports
import ProjectHeader from '@/app/(dashboard)/projects/ProjectHeader';
import BoardView from '../BoardView';
import ListView from '../ListView';
import TableView from '../TableView';
import Timeline from '../TimelineView';
import ArchiveView from '../ArchiveView';
import ModalNewTask from '@/components/ModalNewTask';
import ModalEditProject from '../ModalEditProject';
import ModalNewVersion from '../ModalNewVersion';

// State and API Imports
import {
    useGetProjectsQuery, 
    useGetTasksQuery, 
    useArchiveAndIncrementVersionMutation, 
    useGetProjectVersionHistoryQuery,
    Project as ProjectType
} from '@/state/api';

const Project = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);

    // State
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // API Hooks
    const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
    const currentProject = useMemo(() => projects?.find((p: ProjectType) => p.id === Number(id)), [projects, id]);

    // **THE FIX**: Fetch ALL tasks for the project ID and let the frontend filter them.
    // This simplifies the logic and ensures all views have access to all data they might need.
    const { data: allTasksForProject, isLoading: tasksLoading } = useGetTasksQuery(
        { projectId: Number(id) },
        { skip: !currentProject }
    );
    
    const [archiveAndIncrement, { isLoading: isArchiving }] = useArchiveAndIncrementVersionMutation();
    const { data: versionHistory = [] } = useGetProjectVersionHistoryQuery(Number(id));

    // Derived State
    const activeTasks = useMemo(() => allTasksForProject?.filter(t => t.version === currentProject?.version) || [], [allTasksForProject, currentProject]);
    const archivedTasks = useMemo(() => allTasksForProject?.filter(t => t.version !== currentProject?.version) || [], [allTasksForProject, currentProject]);

    const allActiveTasksCompleted = useMemo(() => {
        if (!activeTasks || activeTasks.length === 0) return false;
        return activeTasks.every(task => task.status === 'Completed');
    }, [activeTasks]);
    
    // Handlers
    const handleArchiveClick = () => {
        if (!allActiveTasksCompleted) {
            toast.error("All tasks must be marked as 'Completed' before starting a new version.");
            return;
        }
        setIsNewVersionModalOpen(true);
    };

    const handleCreateNewVersion = (startDate: string, endDate: string) => {
        toast.promise(archiveAndIncrement({ projectId: Number(id), startDate, endDate }).unwrap(), {
            loading: 'Archiving and creating new version...',
            success: 'Project successfully versioned!',
            error: (err) => err.data?.message || 'Failed to create new version.'
        });
        setIsNewVersionModalOpen(false);
    };

    const isLoading = projectsLoading || tasksLoading;
    if (isLoading) {
        return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading project details...</div>;
    }

    return (
        <div>
            <ModalNewTask isOpen={isModalNewTaskOpen} onClose={() => setIsModalNewTaskOpen(false)} id={id} />
            <ModalEditProject isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} project={currentProject || null} />
            <ModalNewVersion 
                isOpen={isNewVersionModalOpen}
                onClose={() => setIsNewVersionModalOpen(false)}
                onSubmit={handleCreateNewVersion}
                isLoading={isArchiving}
            />
            
            <ProjectHeader 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                projectName={currentProject?.name || 'Project'}
                description={currentProject?.description}
                version={currentProject?.version}
                onEdit={() => setEditModalOpen(true)}
                onArchive={handleArchiveClick}
                isArchivable={allActiveTasksCompleted && !isArchiving}
                localSearchTerm={localSearchTerm}
                setLocalSearchTerm={setLocalSearchTerm}
            />

            {activeTab === "History" ? (
                <ArchiveView versionHistory={versionHistory} tasks={archivedTasks} />
            ) : (
                <>
                    {/* --- Passing the correct 'activeTasks' prop to all views --- */}
                    { activeTab === "Board" && <BoardView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} /> }
                    { activeTab === "List" && <ListView tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} /> }
                    { activeTab === "Table" && <TableView tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} /> }
                    { activeTab === "Timeline" && <Timeline tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} /> }
                </>
            )}
        </div>
    );
};

export default Project;