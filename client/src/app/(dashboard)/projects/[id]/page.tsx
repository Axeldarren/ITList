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
import { exportProjectToPDF } from '@/lib/pdfGenerator';

// State and API Imports
import { 
    useGetProjectsQuery, 
    useGetTasksQuery, 
    useArchiveAndIncrementVersionMutation, 
    useGetProjectVersionHistoryQuery,
    useGetTeamsQuery, // Fetch all teams to find the correct one
    useGetUsersQuery, // Fetch all users to find PM/PO
    Project as ProjectType
} from '@/state/api';

const Project = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params);

    // Component State
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // API Hooks
    const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
    const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
    
    const currentProject = useMemo(() => projects.find((p: ProjectType) => p.id === Number(id)), [projects, id]);

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
    
    // Event Handlers
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
                onEdit={() => setEditModalOpen(true)}
                onArchive={handleArchiveClick}
                isArchivable={allActiveTasksCompleted && !isArchiving}
                onExportPDF={handleExport}
                localSearchTerm={localSearchTerm}
                setLocalSearchTerm={setLocalSearchTerm}
            />

            {activeTab === "History" ? (
                <ArchiveView versionHistory={versionHistory} tasks={archivedTasks} />
            ) : (
                <>
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