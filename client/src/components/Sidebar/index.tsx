"use client";

import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsSidebarCollapsed, setIsDarkMode } from '@/state';
import { useGetProjectsQuery, useDeleteProjectMutation, useLogoutMutation, useGetUserByIdQuery, Project } from '@/state/api';
import {
    BarChartHorizontal, Briefcase, Calendar, ChevronUp, ChevronsLeft, ChevronsRight,
    FolderKanban, HomeIcon, LucideIcon, Settings, Trash2, User, Users, UserCheck, Wrench,
    Moon, Sun, LogOut,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, MouseEvent, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
import ModalConfirm from '../ModalConfirm';
import { logOut, selectCurrentUser } from '@/state/authSlice';

// --- Context Menu (unchanged) ---
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
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [imageError, setImageError] = useState(false);

    const { data: projects } = useGetProjectsQuery();
    const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
    const [logout] = useLogoutMutation();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const pathname = usePathname();
    const isProjectActive = pathname.startsWith('/projects/');

    const currentUser = useAppSelector(selectCurrentUser);
    const UserID = currentUser?.userId;
    const { data: userData } = useGetUserByIdQuery(UserID!, { skip: !UserID });

    const menuRef = useRef<HTMLDivElement>(null);

    // Reset image error when user data changes
    useEffect(() => {
        if (userData) setImageError(false);
    }, [userData]);

    const handleContextMenu = (e: MouseEvent<HTMLDivElement>, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({ x: rect.left + rect.width, y: rect.top, project });
        setSelectedProjectId(project.id);
    };

    const closeContextMenu = () => {
        setContextMenu(null);
        setSelectedProjectId(null);
    };

    const handleDeleteClick = () => {
        if (!contextMenu) return;
        setProjectToDelete(contextMenu.project);
        setConfirmModalOpen(true);
        closeContextMenu();
    };

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
        }
    };

    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu) closeContextMenu();
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [contextMenu]);

    const sidebarClassNames = `fixed flex flex-col h-full
        transition-all duration-300 ease-in-out z-40 bg-white dark:bg-dark-bg
        border-r border-gray-100 dark:border-dark-tertiary overflow-hidden whitespace-nowrap
        ${isSidebarCollapsed ? 'w-0 md:w-[60px]' : 'w-full md:w-64'}
    `;

    return (
        <div className={sidebarClassNames}>
            {/* Confirmation Modal */}
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
                    <ContextMenu x={contextMenu.x} y={contextMenu.y} onDelete={handleDeleteClick} />
                </div>
            )}

            {/* Logo / Brand (sticky top) */}
            <div className={`z-50 flex min-h-[56px] items-center py-3 border-b border-gray-100 dark:border-dark-tertiary flex-shrink-0 ${isSidebarCollapsed ? 'px-2.5' : 'px-5'}`}>
                {!isSidebarCollapsed && (
                    <div className='flex items-center min-w-0'>
                        <Image src="/Code.svg" alt='Logo' width={32} height={32} className='flex-shrink-0' />
                        <div className='text-lg font-bold tracking-tight text-gray-900 dark:text-white ml-3 whitespace-nowrap overflow-hidden'>
                            ITLIST
                        </div>
                    </div>
                )}
                <button
                    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={`py-2 w-10 flex items-center justify-center flex-shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
                    onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}
                >
                    {isSidebarCollapsed ? (
                        <ChevronsRight className='h-5 w-5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors' />
                    ) : (
                        <ChevronsLeft className='h-5 w-5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors' />
                    )}
                </button>
            </div>

            {/* Navigation (scrollable) */}
            <div className='flex flex-1 w-full flex-col justify-start overflow-y-auto overflow-x-hidden'>

                {/* MENU Section */}
                {!isSidebarCollapsed && (
                    <div className="px-5 pt-4 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Menu</span>
                    </div>
                )}
                <nav className='z-10 w-full'>
                    <SidebarLink icon={HomeIcon} label='Dashboard' href='/home' />
                    {currentUser?.role === 'ADMIN' && (
                        <>
                            <SidebarLink icon={BarChartHorizontal} label='Reporting' href='/reporting' />
                            <SidebarLink icon={UserCheck} label='Assignments' href='/assignments' />
                        </>
                    )}
                    <SidebarLink icon={Calendar} label='Timeline' href='/timeline' />
                    {currentUser?.role !== 'BUSINESS_OWNER' && (
                        <SidebarLink icon={Wrench} label='Product Maintenance' href='/product-maintenance' />
                    )}
                </nav>

                {/* SETTINGS Section */}
                {!isSidebarCollapsed && (
                    <div className="px-5 pt-4 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Settings</span>
                    </div>
                )}
                <nav className='z-10 w-full'>
                    <SidebarLink icon={Settings} label='Settings' href='/settings' />
                    <SidebarLink icon={User} label='Users' href='/users' />
                    <SidebarLink icon={Users} label='Team' href='/teams' />
                </nav>

                {/* PROJECTS Section */}
                {isSidebarCollapsed ? (
                    <div className="w-full">
                        <button
                            aria-label="Show projects"
                            onClick={() => dispatch(setIsSidebarCollapsed(false))}
                            className={`relative flex w-full cursor-pointer items-center gap-3 transition-colors hover:bg-accent-50 dark:hover:bg-white/5 justify-center px-4 py-2.5 rounded-md ${isProjectActive ? 'bg-accent-50 dark:bg-white/5' : ''}`}
                        >
                            <FolderKanban className={`h-5 w-5 flex-shrink-0 ${isProjectActive ? 'text-accent-500 dark:text-accent-400' : 'text-gray-500 dark:text-gray-400'}`} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowProjects((prev) => !prev)}
                        className='flex w-full items-center justify-between px-8 py-3 md:justify-between md:px-6 md:py-2.5 hover:bg-accent-50 dark:hover:bg-white/5 transition-colors rounded-md'
                    >
                        <div className='flex items-center gap-3'>
                            <FolderKanban className='h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400' />
                            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>Projects</span>
                        </div>
                        <ChevronUp className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ease-in-out ${showProjects ? '' : 'rotate-180'}`} />
                    </button>
                )}

                {/* PROJECTS LIST */}
                {!isSidebarCollapsed && (
                    <div className={`grid transition-all duration-300 ease-in-out ${showProjects ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                            <div className="space-y-0.5 pl-4">
                                {/* Active Projects */}
                                <div className="flex items-center justify-between px-8 py-2 md:px-5 md:pt-2 md:pb-1">
                                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Active</h4>
                                    <span className="text-[10px] text-gray-400 rounded-full bg-accent-50 dark:bg-accent-500/10 text-accent-500 dark:text-accent-400 px-1.5 py-0.5 font-semibold">
                                        {projects?.filter(p => p.status === "Start" || p.status === "OnProgress" || p.status === "Resolve").length || 0}
                                    </span>
                                </div>
                                {projects?.filter(p => p.status === "Start" || p.status === "OnProgress" || p.status === "Resolve").map((project) => (
                                    <div key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                                        <SidebarLink icon={Briefcase} label={project.name} href={`/projects/${project.id}`} isSelected={project.id === selectedProjectId} />
                                    </div>
                                ))}

                                {/* Completed Projects */}
                                {projects?.some(p => p.status === "Finish") && (
                                    <>
                                        <div className="flex items-center justify-between px-8 py-2 md:px-5 md:pt-3 md:pb-1 mt-1 border-t border-gray-100 dark:border-dark-tertiary">
                                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Completed</h4>
                                            <span className="text-[10px] text-gray-400 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 font-semibold">
                                                {projects?.filter(p => p.status === "Finish").length || 0}
                                            </span>
                                        </div>
                                        {projects?.filter(p => p.status === "Finish").map((project) => (
                                            <div key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                                                <SidebarLink icon={Briefcase} label={project.name} href={`/projects/${project.id}`} isSelected={project.id === selectedProjectId} />
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Cancelled Projects */}
                                {projects?.some(p => p.status === "Cancel") && (
                                    <>
                                        <div className="flex items-center justify-between px-8 py-2 md:px-5 md:pt-3 md:pb-1 mt-1 border-t border-gray-100 dark:border-dark-tertiary">
                                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Cancelled</h4>
                                            <span className="text-[10px] text-gray-400 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 px-1.5 py-0.5 font-semibold">
                                                {projects?.filter(p => p.status === "Cancel").length || 0}
                                            </span>
                                        </div>
                                        {projects?.filter(p => p.status === "Cancel").map((project) => (
                                            <div key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                                                <SidebarLink icon={Briefcase} label={project.name} href={`/projects/${project.id}`} isSelected={project.id === selectedProjectId} />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section: Theme Toggle + User Profile (sticky) */}
            <div className={`border-t border-gray-100 dark:border-dark-tertiary ${isSidebarCollapsed ? 'px-1.5 py-2' : 'px-4 py-3'}`}>
                {/* Theme Toggle */}
                <button
                    onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
                    className={`flex w-full items-center rounded-lg transition-colors hover:bg-accent-50 dark:hover:bg-white/5 ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'}`}
                >
                    {isDarkMode ? (
                        <Sun className="h-5 w-5 text-amber-400" />
                    ) : (
                        <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                    {!isSidebarCollapsed && (
                        <span className="text-sm text-gray-600 dark:text-gray-300">{isDarkMode ? 'Light' : 'Dark'}</span>
                    )}
                </button>

                {/* User Profile + Logout */}
                <div className={`flex items-center mt-2 rounded-lg ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'}`}>
                    {/* Avatar */}
                    {userData && userData.profilePictureUrl && !imageError ? (
                        <img
                            src={
                                userData.profilePictureUrl.startsWith('http')
                                    ? userData.profilePictureUrl
                                    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${userData.profilePictureUrl}`
                            }
                            alt="Profile"
                            className="h-8 w-8 rounded-full object-cover flex-shrink-0 ring-2 ring-accent-200 dark:ring-accent-500/30"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {userData?.username ? userData.username.substring(0, 2).toUpperCase() : <User size={14} />}
                        </div>
                    )}

                    {!isSidebarCollapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{userData?.username || 'User'}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{currentUser?.role || 'Member'}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                aria-label="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
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
    const isActive = href === '/'
        ? pathname === href
        : (pathname === href || pathname.startsWith(href + '/')) || isSelected;
    const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);

    return (
        <Link href={href} className="w-full">
            <div
                className={`relative flex cursor-pointer items-center gap-3 transition-all duration-150 
                    ${isActive
                        ? "bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    } ${isSidebarCollapsed ? 'justify-center px-4 py-2.5' : 'justify-start px-8 py-2 md:px-6 md:py-2'} rounded-md`}
            >
                {isActive && !isSidebarCollapsed && (
                    <div className='absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-accent-500' />
                )}
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-accent-500 dark:text-accent-400' : ''}`} />
                {!isSidebarCollapsed && (
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-accent-600 dark:text-accent-400' : ''}`}>
                        {label}
                    </span>
                )}
            </div>
        </Link>
    )
}

export default Sidebar;