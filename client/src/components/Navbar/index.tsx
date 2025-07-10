"use client";

import React, { useState } from 'react';
import { Menu, Moon, Search, Settings, Sun, Briefcase, CheckSquare } from "lucide-react";
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsDarkMode, setIsSidebarCollapsed } from '@/state';
import { useRouter } from 'next/navigation';
import { useGetSearchSuggestionsQuery, Suggestion } from '@/state/api';
import { useDebounce } from 'use-debounce';

interface AutocompleteSearchProps {
    onSearch: (query: string) => void;
}

const AutocompleteSearch = ({ onSearch }: AutocompleteSearchProps) => {
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
            case 'Project': return <Briefcase className="h-4 w-4 text-gray-500" />;
            case 'Task': return <CheckSquare className="h-4 w-4 text-gray-500" />;
            default: return null;
        }
    }

    return (
        <div className='relative flex h-min w-[250px]'>
            <Search className='absolute left-3 top-1/2 mr-2 h-5 w-5 -translate-y-1/2 transform text-gray-400 z-10'/>
            <input 
                className='relative w-full rounded-md border-none bg-gray-100 py-2 pl-10 pr-4 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-primary dark:bg-dark-secondary dark:text-white dark:placeholder-gray-400'
                type="search" 
                placeholder="Search everything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            />
            {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md bg-white dark:bg-dark-secondary shadow-lg z-20 border dark:border-dark-tertiary">
                    <ul className="divide-y dark:divide-dark-tertiary">
                        {suggestions.map((item, index) => (
                            <li 
                                key={index}
                                onMouseDown={() => handleSuggestionClick(item)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-tertiary cursor-pointer"
                            >
                                {getIcon(item.type)}
                                <span className="text-gray-800 dark:text-gray-200">{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(state => state.global.isSidebarCollapsed);
  const isDarkMode = useAppSelector(state => state.global.isDarkMode);
  
  const handleGlobalSearch = (query: string) => {
      router.push(`/search?q=${query}`);
  };

  return (
    <div className='flex items-center justify-between bg-white px-4 py-3 dark:bg-black'>
        <div className='flex items-center gap-8'>
            {/* --- THIS IS THE FIX --- */}
            {/* The conditional was changed from !isSidebarCollapsed to isSidebarCollapsed */}
            {isSidebarCollapsed && (
                <button onClick={() => dispatch(setIsSidebarCollapsed(false))}>
                    <Menu className='w-8 h-8 dark:text-white' />
                </button>
            )}
            <AutocompleteSearch onSearch={handleGlobalSearch} />
        </div>

        <div className='flex items-center'>
            <button onClick={() => dispatch(setIsDarkMode(!isDarkMode))} className={isDarkMode ? `rounded p-2 dark:hover:bg-gray-700` : `rounded p-2 hover:bg-gray-100`}>
                {isDarkMode ? <Sun className="h-6 w-6 cursor-pointer dark:text-white" /> : <Moon className="h-6 w-6 cursor-pointer" />}
            </button>
            <Link href="/settings" className={isDarkMode ? 'h-min w-min rounded p-2 dark:hover:bg-gray-700' : 'h-min w-min rounded p-2 hover:bg-gray-100'}>
                <Settings className='h-6 w-6 cursor-pointer dark:text-white' />
            </Link>
            <div className='ml-2 mr-5 hidden min-h-[2em] w-[0.1rem] bg-gray-200 dark:bg-dark-tertiary md:inline-block'></div>
        </div>
    </div>
  );
}

export default Navbar;