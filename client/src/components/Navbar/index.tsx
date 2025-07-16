"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Moon, Search, Settings, Sun, Briefcase, CheckSquare, LogOut, User } from "lucide-react";
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsDarkMode, setIsSidebarCollapsed } from '@/state';
import { useRouter } from 'next/navigation';
import { useGetSearchSuggestionsQuery, Suggestion, useLogoutMutation, useGetUserByIdQuery } from '@/state/api';
import { useDebounce } from 'use-debounce';
import { logOut, selectCurrentUser } from '@/state/authSlice';
import toast from 'react-hot-toast';
import Image from 'next/image'; // Import the Next.js Image component

// --- Autocomplete Component (No changes needed here) ---
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
  
  const currentUser = useAppSelector(selectCurrentUser);
  const UserID = currentUser?.userId;
  const { data: userData } = useGetUserByIdQuery(UserID!, { skip: !UserID });
  const [logout] = useLogoutMutation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // --- NEW: State to handle image loading errors ---
  const [imageError, setImageError] = useState(false);

  const handleGlobalSearch = (query: string) => {
      router.push(`/search?q=${query}`);
  };

  const handleLogout = async () => {
      try {
          await logout().unwrap();
          dispatch(logOut());
          router.push('/login');
          toast.success('Logged out successfully!');
      } catch (err: unknown) {
          const errorMessage = err && typeof err === 'object' && 'data' in err && 
            err.data && typeof err.data === 'object' && 'message' in err.data ? 
            String(err.data.message) : 'Logout failed. Please try again.';
          toast.error(errorMessage);
          console.error('Logout error:', err);
      }
  };

  // Reset image error state when the user changes
  useEffect(() => {
    if (userData) {
        setImageError(false);
    }
  }, [userData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setIsProfileMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='flex items-center justify-between bg-white px-4 py-3 dark:bg-black'>
        <div className='flex items-center gap-8'>
            {isSidebarCollapsed && (
                <button onClick={() => dispatch(setIsSidebarCollapsed(false))}>
                    <Menu className='w-8 h-8 dark:text-white' />
                </button>
            )}
            <AutocompleteSearch onSearch={handleGlobalSearch} />
        </div>

        <div className='flex items-center gap-2'>
            <button onClick={() => dispatch(setIsDarkMode(!isDarkMode))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                {isDarkMode ? <Sun className="h-6 w-6 cursor-pointer text-white" /> : <Moon className="h-6 w-6 cursor-pointer" />}
            </button>
            
            <div className='relative' ref={profileMenuRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                    {/* --- UPDATED: Profile Picture Logic --- */}
                    {userData && userData.profilePictureUrl && !imageError ? (
                        <Image
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${userData.profilePictureUrl}`}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-bold">
                            {userData && userData.username ? userData.username.substring(0, 2).toUpperCase() : <User size={16} />}
                        </div>
                    )}
                </button>

                {isProfileMenuOpen && userData && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-dark-secondary ring-1 ring-black ring-opacity-5 z-30">
                        <div className="py-1">
                            <div className="px-4 py-2 border-b dark:border-dark-tertiary">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userData.username}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userData.email}</p>
                            </div>
                            <Link href="/settings" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                                <Settings className="mr-3 h-5 w-5" />
                                <span>Settings</span>
                            </Link>
                            <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                                <LogOut className="mr-3 h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default Navbar;