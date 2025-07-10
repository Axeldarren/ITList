"use client";

import React, { useState } from 'react';
import ProjectHeader from '@/app/projects/ProjectHeader';
import Board from '../BoardView';
import List from '../ListView';
import Timeline from '../TimelineView';
import Table from '../TableView';
import ModalNewTask from '@/components/ModalNewTask';
import { useGetProjectsQuery } from '@/state/api';
import ModalEditProject from '../ModalEditProject';
import { Project as ProjectType } from '@/state/api';

type Props = {
    params: { id: string };
};

const Project = ({ params }: Props) => {
    const { id } = params;
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    
    // State for local task search
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    const { data: projects, isLoading } = useGetProjectsQuery();
    
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
                onEdit={() => setEditModalOpen(true)}
                localSearchTerm={localSearchTerm}
                setLocalSearchTerm={setLocalSearchTerm}
            />

            { activeTab === "Board" && <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} />}
            { activeTab === "List" && <List id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} />}
            { activeTab === "Table" && <Table id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} />}
            { activeTab === "Timeline" && <Timeline id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} searchTerm={localSearchTerm} />}
        </div>
    );
};

export default Project;