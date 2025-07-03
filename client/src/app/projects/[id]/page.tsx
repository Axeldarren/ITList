"use client";

import React, { useState } from 'react';
import ProjectHeader from '@/app/projects/ProjectHeader';
import Board from '../BoardView';
import List from '../ListView';
import Timeline from '../TimelineView';
import Table from '../TableView';
import ModalNewTask from '@/components/ModalNewTask';
import { useGetProjectsQuery } from '@/state/api'; // Import the query hook

type Props = {
    params: { id: string };
};

const Project = ({ params }: Props) => {
    const { id } = params;
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

    // --- NEW: Fetch projects data to find the current project ---
    const { data: projects, isLoading } = useGetProjectsQuery();
    const currentProject = projects?.find(p => p.id === Number(id));

    if (isLoading) {
        return <div>Loading project details...</div>;
    }

    return (
        <div>
            <ModalNewTask
                isOpen={isModalNewTaskOpen}
                onClose={() => setIsModalNewTaskOpen(false)}
                id={id}
            />
            
            {/* --- UPDATED: Pass the new props to the header --- */}
            <ProjectHeader 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                projectName={currentProject?.name || 'Project'}
                description={currentProject?.description}
                version={currentProject?.version}
            />

            { activeTab === "Board" && <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
            { activeTab === "List" && <List id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
            { activeTab === "Timeline" && <Timeline id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
            { activeTab === "Table" && <Table id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />}
        </div>
    );
};

export default Project;