"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import ProjectRecap from './ProjectRecap';
import DeveloperProductivity from './DeveloperProductivity'; // We will create this later
import WeeklyReport from './WeeklyReport';

const ReportingPage = () => {
    const [activeTab, setActiveTab] = useState('projects');

    const renderTabButton = (tabName: string, label: string) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`px-4 py-2 text-sm font-semibold rounded-md ${
                    isActive 
                        ? 'bg-blue-primary text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-dark-tertiary dark:text-gray-200 hover:bg-gray-300'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="p-8">
            <Header name="Reporting & Analytics" />
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-dark-tertiary pb-4">
                {renderTabButton('projects', 'Project Recap')}
                {renderTabButton('developers', 'Developer Productivity')}
                {renderTabButton('weekly', 'Weekly Report')}
            </div>

            <div>
                {activeTab === 'projects' && <ProjectRecap />}
                {activeTab === 'developers' && <DeveloperProductivity />}
                {activeTab === 'weekly' && <WeeklyReport />}
            </div>
        </div>
    );
};

export default ReportingPage;