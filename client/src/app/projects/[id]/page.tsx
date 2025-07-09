"use client";

import React, { useState } from 'react';
import ProjectHeader from '@/app/projects/ProjectHeader';
import Board from '../BoardView';
import List from '../ListView';
import Timeline from '../TimelineView';
import Table from '../TableView';
import ModalNewTask from '@/components/ModalNewTask';
import { useGetProjectsQuery } from '@/state/api';
// Import the new edit modal
import ModalEditProject from '../ModalEditProject';
import { Project as ProjectType } from '@/state/api';

type Props = {
    params: { id: string };
};

const Project = ({ params }: Props) => {
    const { id } = params;
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
    
    // --- NEW: State for the edit modal ---
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    const { data: projects, isLoading } = useGetProjectsQuery();
    
    // Find the current project from the fetched list
    const currentProject = projects?.find((p: ProjectType) => p.id === Number(id));

    if (isLoading) {
        return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading project details...</div>;
    }

    return (
        <div>
            <ModalNewTask
                isOpen={isModalNewTaskOpen}
                onClose={() => setIsModalNewTaskOpen(false)}
                id={id}
            />
            
            {/* --- NEW: Add the edit modal to the page --- */}
            <ModalEditProject
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                project={currentProject || null}
            />
            
            <ProjectHeader 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                projectName={currentProject?.name || 'Project'}
                description={currentProject?.description}
                version={currentProject?.version}
                // --- NEW: Pass the handler to open the modal ---
                onEdit={() => setEditModalOpen(true)}
            />

            { activeTab === "Board" && <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
            { activeTab === "List" && <List id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
            { activeTab === "Timeline" && <Timeline id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
            { activeTab === "Table" && <Table id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
        </div>
    );
};

export default Project;