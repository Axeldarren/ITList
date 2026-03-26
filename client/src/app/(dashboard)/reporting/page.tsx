"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux';
import { selectCurrentUser } from '@/state/authSlice';
import { useGetUserByIdQuery } from '@/state/api';
import Header from '@/components/Header';
import Overview from './Overview';
import ProjectRecap from './ProjectRecap';
import DeveloperProductivity from './DeveloperProductivity';
import WeeklyReport from './WeeklyReport';
import { LayoutDashboard, Briefcase, Users, Calendar } from 'lucide-react';

const ReportingPage = () => {
    const router = useRouter();
    const currentUser = useAppSelector(selectCurrentUser);
    const { data: userData, isLoading: userDataLoading } = useGetUserByIdQuery(currentUser?.userId!, { skip: !currentUser?.userId });
    
    const isAllowed = 
        currentUser?.role === 'ADMIN' || userData?.role === 'ADMIN' || 
        currentUser?.role === 'BUSINESS_OWNER' || userData?.role === 'BUSINESS_OWNER';

    useEffect(() => {
        // Wait for userData to load before making a decision to redirect
        if (!userDataLoading && (currentUser || userData) && !isAllowed) {
            router.push('/unauthorized');
        }
    }, [currentUser, userData, isAllowed, router, userDataLoading]);

    const [activeTab, setActiveTab] = useState('overview');

    const renderTabButton = (tabName: string, label: string, icon: React.ReactNode) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-dark-secondary dark:border-dark-tertiary dark:text-gray-300 dark:hover:bg-dark-tertiary'
                }`}
            >
                {icon}
                {label}
            </button>
        );
    };

    return (
        <div className="p-8">
            <Header name="Reporting & Analytics" />
            <div className="flex flex-wrap items-center gap-3 mb-8 pb-4">
                {renderTabButton('overview', 'Overview', <LayoutDashboard size={16} />)}
                {renderTabButton('projects', 'Project Recap', <Briefcase size={16} />)}
                {renderTabButton('developers', 'Developer Productivity', <Users size={16} />)}
                {renderTabButton('weekly', 'Weekly Report', <Calendar size={16} />)}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'overview' && <Overview />}
                {activeTab === 'projects' && <ProjectRecap />}
                {activeTab === 'developers' && <DeveloperProductivity />}
                {activeTab === 'weekly' && <WeeklyReport />}
            </div>
        </div>
    );
};

export default ReportingPage;