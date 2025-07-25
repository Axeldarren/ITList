"use client";

import React, { use, useState, useMemo, useEffect } from 'react';
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
import { exportProjectToPDF } from '@/lib/pdfGenerator';

// State and API Imports
import {
    useGetProjectsQuery,
    useGetTasksQuery,
    useArchiveAndIncrementVersionMutation,
    useGetProjectVersionHistoryQuery,
    useGetTeamsQuery,
    useGetUsersQuery,
    useUpdateProjectStatusMutation,
    Project as ProjectType,
    ProjectStatus
} from '@/state/api';

const Project = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);

    // --- State and Hooks ---
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
    const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
    
    const currentProject = useMemo(() => projects.find((p: ProjectType) => p.id === Number(id)), [projects, id]);

    const { data: allTasksForProject, isLoading: tasksLoading } = useGetTasksQuery(
        { projectId: Number(id) }, { skip: !currentProject }
    );
    
    const [archiveAndIncrement, { isLoading: isArchiving }] = useArchiveAndIncrementVersionMutation();
    const { data: versionHistory = [] } = useGetProjectVersionHistoryQuery(Number(id));
    const [updateProjectStatus, { isLoading: isUpdatingStatus }] = useUpdateProjectStatusMutation();

    // --- Derived State ---
    const activeTasks = useMemo(() => allTasksForProject?.filter(t => t.version === currentProject?.version) || [], [allTasksForProject, currentProject]);
    const archivedTasks = useMemo(() => allTasksForProject?.filter(t => t.version !== currentProject?.version) || [], [allTasksForProject, currentProject]);
    
    const allActiveTasksCompleted = useMemo(() => {
        if (!activeTasks || activeTasks.length === 0) return false;
        if (activeTasks.every(task => task.status === 'Completed')) return true;
        console.log("Not all active tasks are completed:", activeTasks);
        return false;
    }, [activeTasks]);

    const canCreateNewVersion = useMemo(() => {
        if (currentProject?.status === ProjectStatus.Cancel) return true;
        if (currentProject?.status === ProjectStatus.Finish) return allActiveTasksCompleted;
        return false;
    }, [currentProject?.status, allActiveTasksCompleted]);

    // --- Logic Effects ---
    // Effect to auto-update status to 'Resolve'
    useEffect(() => {
        if (allActiveTasksCompleted && activeTasks.length > 0 && currentProject?.status === ProjectStatus.OnProgress) {
            updateProjectStatus({ projectId: Number(id), status: ProjectStatus.Resolve });
        }
    }, [allActiveTasksCompleted, activeTasks, currentProject, id, updateProjectStatus]);

    useEffect(() => {
        if (!allActiveTasksCompleted && currentProject?.status === ProjectStatus.Resolve) {
            // Silently move the status back to On Progress
            updateProjectStatus({ projectId: Number(id), status: ProjectStatus.OnProgress });
        }
    }, [allActiveTasksCompleted, currentProject, id, updateProjectStatus]);

    const isProjectActive = useMemo(() => {
        if (!currentProject) return false;
        return currentProject.status !== ProjectStatus.Finish && currentProject.status !== ProjectStatus.Cancel;
    }, [currentProject]);

    // --- Event Handlers ---
    const handleStatusChange = (newStatus: ProjectStatus | string) => {
        if (isUpdatingStatus) return;
        const promise = updateProjectStatus({ projectId: Number(id), status: newStatus }).unwrap();
        toast.promise(promise, {
            loading: 'Updating status...',
            success: `Project status updated to ${newStatus}!`,
            error: (err) => err.data?.message || 'Failed to update status.'
        });
    };

    const handleArchiveClick = () => {
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
    
    const handleExport = () => {
        if (!currentProject || !activeTasks || !teams || !users) {
            toast.error("Data is not yet available for the report.");
            return;
        }

        const teamDetails = teams.find(team => team.id === currentProject.teamId);
        if (!teamDetails) {
            toast.error("Could not find team details for this project.");
            return;
        }

        const projectManager = users.find(u => u.userId === teamDetails.projectManagerUserId);
        const productOwner = users.find(u => u.userId === teamDetails.productOwnerUserId);
        
        const developerIds = new Set(activeTasks.map(t => t.assignedUserId).filter(Boolean));
        const developers = users.filter(u => developerIds.has(u.userId));

        exportProjectToPDF(currentProject, activeTasks, projectManager, productOwner, developers);
    };

    const isLoading = projectsLoading || tasksLoading || teamsLoading || usersLoading;
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
                status={currentProject?.status}
                onEdit={() => setEditModalOpen(true)}
                onArchive={handleArchiveClick}
                isArchivable={canCreateNewVersion}
                onExportPDF={handleExport}
                onStatusChange={handleStatusChange}
                localSearchTerm={localSearchTerm}
                setLocalSearchTerm={setLocalSearchTerm}
            />

            {activeTab === "History" ? (
                <ArchiveView versionHistory={versionHistory} tasks={archivedTasks} />
            ) : (
                <>
                    { activeTab === "Board" && <BoardView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                    { activeTab === "List" && <ListView tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                    { activeTab === "Table" && <TableView tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                    { activeTab === "Timeline" && <Timeline tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                </>
            )}
        </div>
    );
};

export default Project;