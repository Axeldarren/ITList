"use client";

import React, { useState } from 'react';
import { useGetProjectActivitiesQuery } from '@/state/api';
import { formatDistanceToNow, format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { MessageSquare, Plus, CheckCircle, Minus, Edit, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Image from 'next/image';

type Props = {
    projectId: number;
    searchTerm?: string;
};

type DateFilterType = 'day' | 'week' | 'month' | 'all';

const ActivityIcon = ({ type }: { type: string }) => {
    switch(type) {
        case 'TASK_CREATED':
            return <div className="bg-blue-500 rounded-full p-2"><Plus size={12} className="text-white" /></div>;
        case 'TASK_STATUS_UPDATED':
            return <div className="bg-green-500 rounded-full p-2"><CheckCircle size={12} className="text-white" /></div>;
        case 'COMMENT_ADDED':
            return <div className="bg-yellow-500 rounded-full p-2"><MessageSquare size={12} className="text-white" /></div>;
        case 'TASK_DELETED':
            return <div className="bg-red-500 rounded-full p-2"><Minus size={12} className="text-white" /></div>;
        case 'TASK_UPDATED':
            return <div className="bg-purple-500 rounded-full p-2"><Edit size={12} className="text-white" /></div>;
        default:
            return null;
    }
}

const ActivityView = ({ projectId, searchTerm = '' }: Props) => {
    const [dayOffset, setDayOffset] = useState(0);
    const [dateFilterType, setDateFilterType] = useState<DateFilterType>('day');
    const [showDatePicker, setShowDatePicker] = useState(false);
    // For calendar date selection
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const { data: activities = [], isLoading, isError } = useGetProjectActivitiesQuery(projectId);

    // Calculate the target date based on offset
    const getTargetDate = (offset: number) => {
        if (dateFilterType === 'day' && selectedDate) {
            // Use selectedDate for 'day' mode
            return new Date(selectedDate);
        }
        const today = new Date();
        return addDays(today, offset);
    };

    // Get date range based on filter type and offset
    const getDateRange = () => {
        let baseDate: Date;
        if (dateFilterType === 'day' && selectedDate) {
            baseDate = new Date(selectedDate);
        } else {
            baseDate = getTargetDate(dayOffset);
        }
        switch (dateFilterType) {
            case 'day':
                return {
                    start: startOfDay(baseDate),
                    end: endOfDay(baseDate)
                };
            case 'week':
                const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
                return {
                    start: startOfDay(weekStart),
                    end: endOfDay(weekEnd)
                };
            case 'month':
                return {
                    start: startOfDay(startOfMonth(baseDate)),
                    end: endOfDay(endOfMonth(baseDate))
                };
            case 'all':
                return {
                    start: new Date(0),
                    end: new Date()
                };
            default:
                return {
                    start: startOfDay(baseDate),
                    end: endOfDay(baseDate)
                };
        }
    };

    // Filter activities for the selected date range and search term
    const filteredActivities = activities.filter(activity => {
        const { start, end } = getDateRange();
        const activityDate = new Date(activity.createdAt);
        
        // Check if activity is in the date range
        const isInDateRange = activityDate >= start && activityDate <= end;

        // If no search term, return all activities for the date range
        if (!searchTerm || searchTerm.trim() === '') {
            return isInDateRange;
        }

        // Filter by search term (task title, description, or user name)
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        const matchesTaskTitle = activity.task?.title?.toLowerCase().includes(lowercaseSearchTerm);
        const matchesDescription = activity.description.toLowerCase().includes(lowercaseSearchTerm);
        const matchesUsername = activity.user.username.toLowerCase().includes(lowercaseSearchTerm);

        return isInDateRange && (matchesTaskTitle || matchesDescription || matchesUsername);
    });

    const targetDate = dateFilterType === 'day' && selectedDate ? new Date(selectedDate) : getTargetDate(dayOffset);
    const isCurrentDay = dateFilterType === 'day' && selectedDate === new Date().toISOString().split('T')[0];
    
    const getDateLabel = () => {
        switch (dateFilterType) {
            case 'day':
                if (isCurrentDay) return 'Today';
                return format(targetDate, 'MMM dd, yyyy');
            case 'week':
                const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
                if (dayOffset === 0) return 'This Week';
                return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
            case 'month':
                if (dayOffset === 0) return 'This Month';
                return format(targetDate, 'MMMM yyyy');
            case 'all':
                return 'All Time';
            default:
                return format(targetDate, 'MMM dd, yyyy');
        }
    };

    const handleFilterTypeChange = (newType: DateFilterType) => {
        setDateFilterType(newType);
        setShowDatePicker(false); // Hide date picker when switching modes
        if (newType === 'all') {
            setDayOffset(0); // Reset to current when showing all
        }
        if (newType === 'day') {
            // Reset to today when switching to day mode
            const today = new Date();
            setSelectedDate(today.toISOString().split('T')[0]);
        }
    };

    const handleDateLabelClick = () => {
        if (dateFilterType === 'day') {
            setShowDatePicker(!showDatePicker);
        }
    };

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        setShowDatePicker(false); // Hide picker after selection
    };

    const canNavigateNext = () => {
        if (dateFilterType === 'all' || dateFilterType === 'day') return false;
        return dayOffset < 0; // Can't go beyond today
    };

    const getNavigationStep = () => {
        switch (dateFilterType) {
            case 'day': return 1;
            case 'week': return 7;
            case 'month': return 30; // Approximate for month navigation
            default: return 1;
        }
    };

    if (isLoading) return <div className="p-6 text-center">Loading activity...</div>;
    if (isError) return <div className="p-6 text-center text-red-500">Failed to load activity.</div>;

    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex w-full items-center justify-between border-b border-gray-100 dark:border-dark-tertiary py-2 mb-3">
                {/* Title Section */}
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Project Activity
                    </h1>
                </div>
                {/* Filter Controls Section - All in one row */}
                <div className="flex items-center gap-4">
                    {/* Filter Type Selector */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        {(['day', 'week', 'month', 'all'] as DateFilterType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => handleFilterTypeChange(type)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    dateFilterType === type
                                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                    {/* Enhanced Date Display and Navigation for all modes */}
                    <div className="flex items-center gap-2">
                        {/* Navigation Button - Left */}
                        <div className="w-8 flex justify-center">
                            {dateFilterType !== 'all' && dateFilterType !== 'day' && (
                                <button 
                                    onClick={() => setDayOffset(prev => prev - getNavigationStep())}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={`Previous ${dateFilterType}`}
                                >
                                    <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            )}
                        </div>
                        
                        {/* Enhanced Date Display Section */}
                        <div className="w-[200px] relative">
                            <div className="bg-white dark:bg-dark-tertiary rounded-md border border-gray-200 dark:border-gray-600 px-3 py-1.5 shadow-sm">
                                {/* Clickable Date Label */}
                                <div 
                                    className={`text-center ${dateFilterType === 'day' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-1 py-0.5 transition-colors' : ''}`}
                                    onClick={handleDateLabelClick}
                                    title={dateFilterType === 'day' ? 'Click to select date' : ''}
                                >
                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center justify-center gap-1.5 min-h-[20px]">
                                        {dateFilterType === 'day' && <Calendar size={12} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                                        <span className="truncate">{getDateLabel()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
                                        {searchTerm && ` matching "${searchTerm}"`}
                                    </div>
                                </div>
                                
                                {/* Date Picker Dropdown for Day mode */}
                                {dateFilterType === 'day' && showDatePicker && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 p-2">
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm dark:bg-dark-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            value={selectedDate}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={e => handleDateChange(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex justify-between mt-1.5 gap-2">
                                            <button
                                                onClick={() => setShowDatePicker(false)}
                                                className="px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const today = new Date();
                                                    handleDateChange(today.toISOString().split('T')[0]);
                                                }}
                                                className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                            >
                                                Today
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Navigation Button - Right */}
                        <div className="w-8 flex justify-center">
                            {dateFilterType !== 'all' && dateFilterType !== 'day' && (
                                <button 
                                    onClick={() => setDayOffset(prev => prev + getNavigationStep())}
                                    disabled={!canNavigateNext()}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={`Next ${dateFilterType}`}
                                >
                                    <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Activities List */}
            {filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm 
                            ? `No activities found for "${searchTerm}" on ${getDateLabel().toLowerCase()}`
                            : `No activities found for ${getDateLabel().toLowerCase()}`
                        }
                    </p>
                    {searchTerm && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Try searching for task names, activity descriptions, or usernames
                        </p>
                    )}
                </div>
            ) : (
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {filteredActivities.map((activity, activityIdx) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {activityIdx !== filteredActivities.length - 1 ? (
                                        <span className="absolute left-6 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex items-start space-x-4">
                                        <div className="relative">
                                            {activity.user.profilePictureUrl ? (
                                                <Image
                                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${activity.user.profilePictureUrl}`}
                                                    alt={activity.user.username}
                                                    width={48}
                                                    height={48}
                                                    className="h-12 w-12 rounded-full object-cover ring-4 ring-white dark:ring-dark-bg"
                                                />
                                            ) : (
                                                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400 ring-4 ring-white dark:ring-dark-bg">
                                                    <span className="text-lg font-medium text-white">
                                                        {activity.user.username.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-0.5 py-0.5 dark:bg-dark-secondary">
                                                <ActivityIcon type={activity.type} />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-3">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                <span className="font-semibold text-gray-900 dark:text-white">{activity.user.username}</span> {activity.description}
                                            </p>
                                            {activity.task && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                    Task: {activity.task.title}
                                                </p>
                                            )}
                                            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                                <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                                <span className="font-medium">
                                                    {format(new Date(activity.createdAt), 'EEEE, MMM dd')}
                                                </span>
                                                {format(new Date(activity.createdAt), 'yyyy-MM-dd') === new Date().toISOString().split('T')[0] && (
                                                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded text-xs font-medium">
                                                        Today
                                                    </span>
                                                )}
                                                {format(new Date(activity.createdAt), 'yyyy-MM-dd') === new Date(Date.now() - 86400000).toISOString().split('T')[0] && (
                                                    <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded text-xs font-medium">
                                                        Yesterday
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ActivityView;