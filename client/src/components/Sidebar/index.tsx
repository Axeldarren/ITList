"use client";

import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsSidebarCollapsed } from '@/state';
import { useGetProjectsQuery, useDeleteProjectMutation, Project } from '@/state/api'; 
import { AlertCircle, AlertOctagon, AlertTriangle, Briefcase, ChevronDown, ChevronUp, HomeIcon, Layers3, LockIcon, LucideIcon, Settings, ShieldAlert, Trash2, User, Users, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, MouseEvent, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
import ModalConfirm from '../ModalConfirm'; // Import the new modal

interface ContextMenuProps {
    x: number;
    y: number;
    onDelete: () => void;
}

const ContextMenu = ({ x, y, onDelete }: ContextMenuProps) => {
    return ReactDOM.createPortal(
        <div
            style={{ top: y, left: x }}
            className="fixed z-50 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-dark-secondary"
        >
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    onDelete();
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-500 dark:hover:bg-gray-600"
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


    const sidebarClassNames = `fixed flex flex-col h-full justify-between shadow-xl
        transition-all duration-300 z-40 dark:bg-black overflow-y-auto bg-white
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
                <div className='z-50 flex min-h-[56px] w-64 items-center justify-between bg-white px-6 pt-3 dark:bg-black'>
                    <div className='text-xl font-bold text-gray-800 dark:text-white'>
                        ITLIST
                    </div>
                    {!isSidebarCollapsed && (
                        <button className='py-3' onClick={() => dispatch(setIsSidebarCollapsed(true))}>
                            <X className='h-6 w-6 text-gray-800 hover:text-gray-500 dark:text-white' />
                        </button>
                    )}
                </div>
                {/* TEAM */}
                <div className='flex items-center gap-5 border-y-[1.5px] border-gray-200 px-8 py-4 dark:border-gray-700'>
                    <Image src="/Code.svg" alt='Logo' width={40} height={40} /> 
                    <div>
                        <h3 className='text-md font-bold tracking-wide dark:text-gray-200'>
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
                    <SidebarLink icon={Briefcase} label='Timeline' href='/timeline' />
                    <SidebarLink icon={Settings} label='Settings' href='/settings' />
                    <SidebarLink icon={User} label='Users' href='/users' />
                    <SidebarLink icon={Users} label='Team' href='/teams' />
                </nav>

                {/* PROJECTS LINKS */}
                <button 
                    onClick={() => setShowProjects((prev) => !prev)} 
                    className='flex w-full items-center justify-between px-8 py-3 text-gray-500'
                >
                    <span className=''>Projects</span>
                    {showProjects ? (
                        <ChevronUp className='h-5 w-5' />
                    ) : (
                        <ChevronDown className='h-5 w-5' />
                    )}
                </button>
                {/* PROJECTS LIST */}
                {showProjects && 
                    projects?.map((project) => (
                        <div key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                            <SidebarLink
                                icon={Briefcase}
                                label={project.name}
                                href={`/projects/${project.id}`}
                                isSelected={project.id === selectedProjectId}
                            />
                        </div>
                ))}
                
                {/* PRIORITY LINKS */}
                <button 
                    onClick={() => setShowPriority((prev) => !prev)} 
                    className='flex w-full items-center justify-between px-8 py-3 text-gray-500'
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
                className={`relative flex cursor-pointer items-center gap-3 transition-colors hover:bg-gray-100 dark:bg-black dark:hover:bg-gray-600 ${
                    isActive ? "bg-gray-100 text-white dark:bg-gray-600" : ""
                } justify-start px-8 py-3`}
            >
                {isActive && (
                    <div className='absolute left-0 top-0 h-full w-[5px] bg-blue-200' />
                )}

                <Icon className='h-6 w-6 text-gray-800 dark:text-gray-100' />
                <span className={`font-medium text-gray-800 dark:text-gray-100`}>
                    {label}
                </span>
            </div>
        </Link>
    )
}

export default Sidebar;