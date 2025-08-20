"use client";

import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsSidebarCollapsed } from '@/state';
import { useGetProjectsQuery, useDeleteProjectMutation, Project } from '@/state/api'; 
import { AlertCircle, AlertOctagon, AlertTriangle, BarChartHorizontal, Briefcase, ChevronDown, ChevronUp, HomeIcon, Layers3, LockIcon, LucideIcon, Settings, ShieldAlert, Trash2, User, Users, X, UserCheck, Wrench } from 'lucide-react';
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
    const [showPriority, setShowPriority] = useState(true);
  
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
        transition-all duration-300 z-40 bg-white/80 dark:bg-black/60 backdrop-blur-sm
        border-r border-gray-100 dark:border-dark-tertiary overflow-y-auto
        ${isSidebarCollapsed ? 'w-0 hidden' : 'w-64'}
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
                <div className='z-50 flex min-h-[56px] w-64 items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-dark-tertiary'>
                    <div className='text-lg font-semibold tracking-tight text-gray-900 dark:text-white'>
                        ITLIST
                    </div>
                    {!isSidebarCollapsed && (
                        <button className='py-2' onClick={() => dispatch(setIsSidebarCollapsed(true))}>
                            <X className='h-6 w-6 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white' />
                        </button>
                    )}
                </div>
                {/* TEAM */}
                <div className='flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-dark-tertiary'>
                    <Image src="/Code.svg" alt='Logo' width={40} height={40} /> 
                    <div>
                        <h3 className='text-sm font-medium tracking-tight text-gray-600 dark:text-gray-300'>
                            IT TEAM
                        </h3>
                        <div className='mt-1 flex items-start gap-2'>
                            <LockIcon className='mt-[0.1rem] h-3 w-3 text-gray-500 dark:text-gray-400' />
                            <p className='text-xs text-gray-500'>Private</p>
                        </div>
                    </div>
                </div>
                {/* NAVBAR LINKS */}
                <nav className='z-10 w-full'>
                    <SidebarLink icon={HomeIcon} label='Home' href='/' />
                    {currentUser?.isAdmin && (
                        <>
                            <SidebarLink icon={BarChartHorizontal} label='Reporting' href='/reporting' />
                            <SidebarLink icon={UserCheck} label='Assignments' href='/assignments' />
                        </>
                    )}
                    <SidebarLink icon={Briefcase} label='Timeline' href='/timeline' />
                    <SidebarLink icon={Wrench} label='Product Maintenance' href='/product-maintenance' />
                    <SidebarLink icon={Settings} label='Settings' href='/settings' />
                    <SidebarLink icon={User} label='Users' href='/users' />
                    <SidebarLink icon={Users} label='Team' href='/teams' />
                </nav>

                {/* PROJECTS LINKS */}
                <button 
                    onClick={() => setShowProjects((prev) => !prev)} 
                    className='flex w-full items-center justify-between px-5 py-2.5 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition-colors'
                >
                    <span className=''>Projects</span>
                    {showProjects ? (
                        <ChevronUp className='h-5 w-5' />
                    ) : (
                        <ChevronDown className='h-5 w-5' />
                    )}
                </button>
                {/* PROJECTS LIST */}
                {showProjects && (
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
                )}
                
                {/* PRIORITY LINKS */}
                <button 
                    onClick={() => setShowPriority((prev) => !prev)} 
                    className='flex w-full items-center justify-between px-5 py-2.5 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition-colors'
                >
                    <span className=''>Priority</span>
                    {showPriority ? (
                        <ChevronUp className='h-5 w-5' />
                    ) : (
                        <ChevronDown className='h-5 w-5' />
                    )}
                </button>
                {showPriority && (
                    <>
                        <SidebarLink icon={AlertCircle} label='Urgent' href='/priority/urgent' />
                        <SidebarLink icon={ShieldAlert} label='High' href='/priority/high' />
                        <SidebarLink icon={AlertTriangle} label='Medium' href='/priority/medium' />
                        <SidebarLink icon={AlertOctagon} label='Low' href='/priority/low' />
                        <SidebarLink icon={Layers3} label='Backlog' href='/priority/backlog' />
                    </>
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
    const isActive = (pathname === href) || isSelected;

    return (
        <Link href={href} className="w-full">
            <div 
                className={`relative flex cursor-pointer items-center gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                    isActive ? "bg-gray-50 dark:bg-white/5" : ""
                } justify-start px-6 py-2.5 rounded-md`}
            >
                {isActive && <div className='absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-blue-500/60' />}

                <Icon className='h-5 w-5 flex-shrink-0 text-gray-700 dark:text-gray-200' />
                <span className={`text-sm font-medium text-gray-800 dark:text-gray-100 truncate`}>
                    {label}
                </span>
            </div>
        </Link>
    )
}

export default Sidebar;