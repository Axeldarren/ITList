"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, CheckSquare, Menu, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsSidebarCollapsed } from '@/state';
import { useRouter } from 'next/navigation';
import { useGetSearchSuggestionsQuery, Suggestion } from '@/state/api';
import { useDebounce } from 'use-debounce';
import NotificationBell from '@/components/NotificationBell';

// --- Autocomplete Component ---
const AutocompleteSearch = ({ onSearch }: { onSearch: (query: string) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const [debouncedValue] = useDebounce(inputValue, 300);
    const { data: suggestions = [] } = useGetSearchSuggestionsQuery(
        { query: debouncedValue },
        { skip: debouncedValue.length < 2 }
    );
    const [isFocused, setIsFocused] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            onSearch(inputValue.trim());
            setIsFocused(false);
            setInputValue('');
        }
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        onSearch(suggestion.text);
        setIsFocused(false);
        setInputValue('');
    };

    const getIcon = (type: Suggestion['type']) => {
        switch(type) {
            case 'Project': return <Briefcase className="h-4 w-4 text-gray-400" />;
            case 'Task': return <CheckSquare className="h-4 w-4 text-gray-400" />;
            default: return null;
        }
    }

    return (
        <div className='relative flex h-min w-full md:w-[320px]'>
            <Search className='absolute left-3 top-1/2 mr-2 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500 z-10'/>
            <input
                className='relative w-full rounded-xl bg-gray-50 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-400/40 focus:bg-white dark:focus:bg-white/5 transition-all dark:text-gray-100 dark:placeholder-gray-500'
                type="search"
                name="searchbar"
                id='searchbar'
                placeholder="Search tasks or project..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            />
            {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-xl bg-white/95 dark:bg-dark-secondary backdrop-blur-sm ring-1 ring-gray-200 dark:ring-white/10 shadow-xl z-20">
                    <ul className="divide-y divide-gray-100 dark:divide-white/5 py-1">
                        {suggestions.map((item, index) => (
                            <li
                                key={index}
                                onMouseDown={() => handleSuggestionClick(item)}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                            >
                                {getIcon(item.type)}
                                <span className="text-sm text-gray-700 dark:text-gray-200">{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// --- Live Clock Component ---
const LiveClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatDate = (date: Date) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    return (
        <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Today is</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">{formatDate(time)}</span>
            <span className="font-mono font-semibold text-gray-800 dark:text-white tabular-nums">{formatTime(time)}</span>
        </div>
    );
};

const Navbar = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const isSidebarCollapsed = useAppSelector(state => state.global.isSidebarCollapsed);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const mobileSearchRef = useRef<HTMLDivElement>(null);

    // Close mobile search on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
                setMobileSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleGlobalSearch = (query: string) => {
        router.push(`/search?q=${query}`);
        setMobileSearchOpen(false);
    };

    return (
        <div className='sticky top-0 z-30 flex items-center justify-between bg-white/90 dark:bg-dark-bg/90 backdrop-blur-sm border-b border-gray-100 dark:border-dark-tertiary px-3 md:px-6 py-2.5'>
            <div className='flex items-center gap-3 md:gap-6 flex-1 min-w-0'>
                {/* Mobile Sidebar Toggle */}
                <button
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden cursor-pointer"
                    onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>

                <LiveClock />
            </div>

            <div className='flex items-center gap-2 md:gap-3'>
                {/* Desktop search — always visible */}
                <div className="hidden sm:block">
                    <AutocompleteSearch onSearch={handleGlobalSearch} />
                </div>

                {/* Mobile search — icon toggles an expanding bar */}
                <div className="relative sm:hidden" ref={mobileSearchRef}>
                    {mobileSearchOpen ? (
                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
                            <AutocompleteSearch onSearch={handleGlobalSearch} />
                            <button
                                onClick={() => setMobileSearchOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 cursor-pointer"
                                aria-label="Close search"
                            >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setMobileSearchOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            aria-label="Open search"
                        >
                            <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    )}
                </div>

                <NotificationBell />
            </div>
        </div>
    );
}

export default Navbar;