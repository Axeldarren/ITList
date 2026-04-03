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

const TABS = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'projects', label: 'Project Recap', icon: Briefcase },
    { key: 'developers', label: 'Developer Productivity', icon: Users },
    { key: 'weekly', label: 'Weekly Report', icon: Calendar },
] as const;

const ReportingPage = () => {
    const router = useRouter();
    const loggedInUser = useAppSelector(selectCurrentUser);
    const userId = loggedInUser?.userId ?? "";
    const { data: userData, isLoading: userDataLoading } = useGetUserByIdQuery(userId, { skip: !userId });

    const activeUser = userData || loggedInUser;
    const isAllowed =
        activeUser?.role === 'ADMIN' ||
        activeUser?.role === 'BUSINESS_OWNER';

    useEffect(() => {
        if (!userDataLoading && activeUser && !isAllowed) {
            router.push('/unauthorized?required=ADMIN_OR_BO');
        }
    }, [activeUser, isAllowed, router, userDataLoading]);

    const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('overview');

    if (userDataLoading) {
        return (
            <div className="p-6 lg:p-8 space-y-6">
                <div className="animate-pulse h-8 w-52 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse h-10 w-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
                    ))}
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse h-28 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                    ))}
                </div>
            </div>
        );
    }

    if (!isAllowed) return null;

    return (
        <div className="p-6 lg:p-8">
            <Header name="Reporting & Analytics" />

            {/* Tab Navigation */}
            <div className="mt-6 mb-8">
                <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
                    {TABS.map(({ key, label, icon: Icon }) => {
                        const isActive = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? 'bg-white dark:bg-dark-secondary text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                                }`}
                            >
                                <Icon size={15} />
                                {label}
                            </button>
                        );
                    })}
                </div>
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
