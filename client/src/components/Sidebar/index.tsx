"use client";

import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsSidebarCollapsed } from '@/state';
import { useGetProjectsQuery, useDeleteProjectMutation, Project } from '@/state/api'; 
import { BarChartHorizontal, Briefcase, Calendar, ChevronUp, ChevronsLeft, ChevronsRight, FolderKanban, HomeIcon, LucideIcon, Settings, Trash2, User, Users, UserCheck, Wrench } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, MouseEvent, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
import ModalConfirm from '../ModalConfirm'; // Import the new modal
import { selectCurrentUser } from '@/state/authSlice';

interface ContextMenuProps {
    x: number;
    y: number;
    onDelete: () => void;
}

const ContextMenu = ({ x, y, onDelete }: ContextMenuProps) => {
    return ReactDOM.createPortal(
        <div
            style={{ top: y, left: x }}
            className="fixed z-50 w-56 rounded-lg bg-white/95 dark:bg-black/70 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-white/10 shadow-xl py-1.5"
        >
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    onDelete();
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-md"
            >
                <Trash2 className="mr-3 h-5 w-5" />
                <span>Delete</span>
            </a>
        </div>,
        document.body
    );
};

const Sidebar = () => {
    const [showProjects, setShowProjects] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    // --- NEW: State for the confirmation modal ---
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const { data: projects } = useGetProjectsQuery();
    const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
    const dispatch = useAppDispatch();
    const isSidebarCollapsed = useAppSelector(
        (state) => state.global.isSidebarCollapsed,
    );
    const pathname = usePathname();
    
    // Check if currently on a project or priority page
    const isProjectActive = pathname.startsWith('/projects/');


    const currentUser = useAppSelector(selectCurrentUser);
    
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: MouseEvent<HTMLDivElement>, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({ 
            x: rect.left + rect.width,
            y: rect.top,
            project 
        });
        setSelectedProjectId(project.id);
    };

    const closeContextMenu = () => {
        setContextMenu(null);
        setSelectedProjectId(null);
    };

    // --- NEW: Function to open the confirmation modal ---
    const handleDeleteClick = () => {
        if (!contextMenu) return;
        setProjectToDelete(contextMenu.project);
        setConfirmModalOpen(true);
        closeContextMenu();
    };

    // --- NEW: Function to handle the final confirmation ---
    const handleConfirmDelete = () => {
        if (!projectToDelete) return;

        const promise = deleteProject(projectToDelete.id).unwrap();

        toast.promise(promise, {
            loading: 'Deleting project...',
            success: `Project "${projectToDelete.name}" deleted successfully!`,
            error: 'Failed to delete project.'
        });
        setConfirmModalOpen(false);
        setProjectToDelete(null);
    };
    
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu) {
                closeContextMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu]);


    const sidebarClassNames = `fixed flex flex-col h-full justify-between
        transition-all duration-300 ease-in-out z-40 bg-white/80 dark:bg-black/60 backdrop-blur-sm
        border-r border-gray-100 dark:border-dark-tertiary overflow-hidden whitespace-nowrap
        ${isSidebarCollapsed ? 'w-0 md:w-[60px] overflow-y-hidden' : 'w-64 overflow-y-auto'}
    `;

    return (
        <div className={sidebarClassNames}>
            {/* --- NEW: Render the confirmation modal --- */}
            {projectToDelete && (
                <ModalConfirm
                    isOpen={isConfirmModalOpen}
                    onClose={() => setConfirmModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Project"
                    message={`Are you sure you want to permanently delete the "${projectToDelete.name}" project? This action cannot be undone.`}
                    isLoading={isDeleting}
                />
            )}

            {contextMenu && (
                <div ref={menuRef}>
                    <ContextMenu 
                        x={contextMenu.x}
                        y={contextMenu.y}
                        // --- UPDATED: Call the new handler ---
                        onDelete={handleDeleteClick}
                    />
                </div>
            )}
            
            <div className='flex h-full w-full flex-col justify-start'>
                <div className={`z-50 flex min-h-[56px] items-center py-3 border-b border-gray-100 dark:border-dark-tertiary ${
                    isSidebarCollapsed ? 'px-2.5' : 'px-5'
                }`}>
                    {!isSidebarCollapsed && (
                        <div className='flex items-center min-w-0'>
                            <Image src="/Code.svg" alt='Logo' width={32} height={32} className='flex-shrink-0' /> 
                            <div className='text-lg font-semibold tracking-tight text-gray-900 dark:text-white ml-3 whitespace-nowrap overflow-hidden'>
                                ITLIST
                            </div>
                        </div>
                    )}
                    <button className={`py-2 w-10 flex items-center justify-center flex-shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'ml-auto'}`} onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}>
                        {isSidebarCollapsed ? (
                            <ChevronsRight className='h-6 w-6 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors duration-150' />
                        ) : (
                            <ChevronsLeft className='h-6 w-6 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors duration-150' />
                        )}
                    </button>
                </div>
                {/* NAVBAR LINKS */}
                <nav className='z-10 w-full'>
                    <SidebarLink icon={HomeIcon} label='Home' href='/home' />

                    {/* Admin Navigation Links */}

                    {currentUser?.role === 'ADMIN' && (
                        <>
                            <SidebarLink icon={BarChartHorizontal} label='Reporting' href='/reporting' />
                            <SidebarLink icon={UserCheck} label='Assignments' href='/assignments' />
                        </>
                    )}

                    {/* Developer Navigation Links */}

                    <SidebarLink icon={Calendar} label='Timeline' href='/timeline' />
                    <SidebarLink icon={Wrench} label='Product Maintenance' href='/product-maintenance' />
                    <SidebarLink icon={Settings} label='Settings' href='/settings' />
                    <SidebarLink icon={User} label='Users' href='/users' />
                    <SidebarLink icon={Users} label='Team' href='/teams' />

                </nav>

                {/* PROJECTS LINKS */}
                
                {isSidebarCollapsed ? (
                    <div className="w-full">
                        <button 
                            onClick={() => dispatch(setIsSidebarCollapsed(false))} 
                            className={`relative flex w-full cursor-pointer items-center gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 justify-center px-4 py-2.5 rounded-md ${
                                isProjectActive ? 'bg-gray-50 dark:bg-white/5' : ''
                            }`}
                        >
                            <FolderKanban className={`h-5 w-5 flex-shrink-0 ${
                                isProjectActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                            }`} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setShowProjects((prev) => !prev)} 
                        className='flex w-full items-center justify-between px-6 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-md'
                    >
                        <div className='flex items-center gap-3'>
                            <FolderKanban className='h-5 w-5 flex-shrink-0 text-gray-700 dark:text-gray-200' />
                            <span className='text-sm font-medium text-gray-800 dark:text-gray-100'>Projects</span>
                        </div>
                        <ChevronUp className={`h-5 w-5 text-gray-700 dark:text-gray-200 transition-transform duration-200 ease-in-out ${showProjects ? '' : 'rotate-180'}`} />
                    </button>
                )}
                {/* PROJECTS LIST */}
                {!isSidebarCollapsed && (
                    <div className={`grid transition-all duration-300 ease-in-out ${showProjects ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                            <div className="space-y-1.5 pl-4">
                        {/* Active Projects */}
                        <div className="flex items-center justify-between px-5 pt-2 pb-1">
                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Active</h4>
                            <span className="text-xs text-gray-500 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5">
                                {projects?.filter(p => p.status === "Start" || p.status === "OnProgress" || p.status === "Resolve").length || 0}
                            </span>
                        </div>
                        {projects?.filter(p => p.status === "Start" || p.status === "OnProgress" || p.status === "Resolve").map((project) => (
                            <div key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                                <SidebarLink
                                    icon={Briefcase}
                                    label={project.name}
                                    href={`/projects/${project.id}`}
                                    isSelected={project.id === selectedProjectId}
                                />
                            </div>
                        ))}
                        
                        {/* Completed Projects */}
                        {projects?.some(p => p.status === "Finish") && (
                            <>
                                <div className="flex items-center justify-between px-5 pt-3 pb-1 mt-2 border-t border-gray-100 dark:border-dark-tertiary">
                                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Completed</h4>
                                    <span className="text-xs text-gray-500 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5">
                                        {projects?.filter(p => p.status === "Finish").length || 0}
                                    </span>
                                </div>
                                {projects?.filter(p => p.status === "Finish").map((project) => (
                                    <div key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                                        <SidebarLink
                                            icon={Briefcase}
                                            label={project.name}
                                            href={`/projects/${project.id}`}
                                            isSelected={project.id === selectedProjectId}
                                        />
                                    </div>
                                ))}
                            </>
                        )}
                        
                        {/* Cancelled Projects */}
                        {projects?.some(p => p.status === "Cancel") && (
                            <>
                                <div className="flex items-center justify-between px-5 pt-3 pb-1 mt-2 border-t border-gray-100 dark:border-dark-tertiary">
                                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Cancelled</h4>
                                    <span className="text-xs text-gray-500 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5">
                                        {projects?.filter(p => p.status === "Cancel").length || 0}
                                    </span>
                                </div>
                                {projects?.filter(p => p.status === "Cancel").map((project) => (
                                    <div key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                                        <SidebarLink
                                            icon={Briefcase}
                                            label={project.name}
                                            href={`/projects/${project.id}`}
                                            isSelected={project.id === selectedProjectId}
                                        />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                        </div>
                    </div>
                )}
                


            </div>
        </div>
    );
};

interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
    isSelected?: boolean;
}

const SidebarLink = ({
    href,
    icon: Icon,
    label,
    isSelected = false,
}: SidebarLinkProps) => {
    const pathname = usePathname();
    // For home page, use exact match. For others, check if pathname starts with href
    const isActive = href === '/' 
        ? pathname === href 
        : (pathname === href || pathname.startsWith(href + '/')) || isSelected;
    const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);

    return (
        <Link href={href} className="w-full">
            <div 
                className={`relative flex cursor-pointer items-center gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                    isActive ? "bg-gray-50 dark:bg-white/5" : ""
                } ${isSidebarCollapsed ? 'justify-center px-4 py-2.5' : 'justify-start px-6 py-2.5'} rounded-md`}
            >
                {isActive && !isSidebarCollapsed && <div className='absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-blue-500/60' />}

                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`} />
                {!isSidebarCollapsed && (
                    <span className={`text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'} truncate`}>
                        {label}
                    </span>
                )}
            </div>
        </Link>
    )
}

export default Sidebar;