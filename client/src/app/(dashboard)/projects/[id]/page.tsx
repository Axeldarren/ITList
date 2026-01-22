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
import ModalSignatureSelect from '@/components/ModalSignatureSelect';
import { exportProjectDetailToPDF } from '@/lib/projectDetailPdfGenerator';

// Define the signature interface locally to match the modal
interface ProjectSignatureInfo {
    user: User;
    role: 'IT Department Head' | 'IT Supervisor';
}

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
    ProjectStatus,
    User
} from '@/state/api';
import ActivityView from '../ActivityView';

const Project = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);

    // --- State and Hooks ---
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
    const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
    
    const currentProject = useMemo(() => projects.find((p: ProjectType) => p.id === Number(id)), [projects, id]);

    const { data: allTasksForProject, isLoading: tasksLoading } = useGetTasksQuery(
        { projectId: Number(id), version: currentProject?.version }, 
        { skip: !currentProject }
    );
    
    const [archiveAndIncrement, { isLoading: isArchiving }] = useArchiveAndIncrementVersionMutation();
    const [updateProjectStatus, { isLoading: isUpdatingStatus }] = useUpdateProjectStatusMutation();

    // --- Derived State ---
    const tasks = useMemo(() => {
        if (!allTasksForProject) return [];
        if (Array.isArray(allTasksForProject)) return allTasksForProject;
        return 'data' in allTasksForProject ? allTasksForProject.data : [];
    }, [allTasksForProject]);

    const activeTasks = tasks; 
    
    const allActiveTasksCompleted = useMemo(() => {
        if (!activeTasks || activeTasks.length === 0) return false;
        if (activeTasks.every(task => task.status === 'Completed')) return true;
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
        setIsSignatureModalOpen(true);
    };

    const handleExportWithSignatures = (signatures: ProjectSignatureInfo[]) => {
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

        exportProjectDetailToPDF(currentProject, activeTasks, projectManager, productOwner, developers, signatures);
        toast.success("Project report generated successfully!");
    };

    const isLoading = projectsLoading || tasksLoading || teamsLoading || usersLoading;
    if (isLoading) {
        return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading project details...</div>;
    }

    // Show 404 if project is not found (either not in list or access denied)
    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
                <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Project Not Found</div>
                <div className="text-gray-500 dark:text-gray-400">The project does not exist or you do not have access.</div>
            </div>
        );
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
            <ModalSignatureSelect
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onConfirm={handleExportWithSignatures}
                users={users}
            />
            
            <ProjectHeader 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                projectName={currentProject?.name || 'Project'}
                description={currentProject?.description}
                version={currentProject?.version}
                status={currentProject?.status}
                docUrl={currentProject?.docUrl}
                onEdit={() => setEditModalOpen(true)}
                onArchive={handleArchiveClick}
                isArchivable={canCreateNewVersion}
                onExportPDF={handleExport}
                onStatusChange={handleStatusChange}
                localSearchTerm={localSearchTerm}
                setLocalSearchTerm={setLocalSearchTerm}
                teamName={teams.find(team => team.id === currentProject?.teamId)?.teamName}
                ticketNumber={currentProject?.projectTicket?.ticket_id || currentProject?.ticket_id}
            />

            { activeTab === "Activity" && <ActivityView projectId={Number(id)} searchTerm={localSearchTerm} /> }
            { activeTab === "History" && <ArchiveView projectId={Number(id)} /> }

            {/* Existing views */}
            { activeTab !== "History" && activeTab !== "Activity" && (
                <>
                    { activeTab === "Board" && <BoardView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                    { activeTab === "List" && <ListView projectId={Number(id)} version={currentProject?.version || 1} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                    { activeTab === "Table" && <TableView tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                    { activeTab === "Timeline" && <Timeline tasks={activeTasks} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} isProjectActive={isProjectActive}/> }
                </>
            )}
        </div>
    );
};

export default Project;