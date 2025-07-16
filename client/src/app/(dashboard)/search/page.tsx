"use client";

import Header from '@/components/Header';
import { useSearchQuery, Project, Task, User } from '@/state/api';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { Briefcase, User as UserIcon, CheckSquare } from 'lucide-react';
import Link from 'next/link';

// --- NEW: Custom component for a Project search result ---
const ProjectSearchResult = ({ project }: { project: Project }) => (
    <Link href={`/projects/${project.id}`} className="block p-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-dark-tertiary">
        <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{project.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.description || "No description."}</p>
            </div>
        </div>
    </Link>
);

// --- NEW: Custom component for a Task search result ---
const TaskSearchResult = ({ task }: { task: Task & { project?: { name: string } } }) => (
    <Link href={`/projects/${task.projectId}`} className="block p-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-dark-tertiary">
        <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{task.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    In Project: <span className="font-medium">{task.project?.name || "N/A"}</span>
                </p>
            </div>
        </div>
    </Link>
);

// --- NEW: Custom component for a User search result ---
const UserSearchResult = ({ user }: { user: User }) => (
    <div className="p-4 rounded-lg">
        <div className="flex items-center gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{user.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
        </div>
    </div>
);


const Search = () => {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const { data: searchResults, isLoading, isError } = useSearchQuery(query, {
        skip: !query,
    });

    const hasResults = searchResults && ((searchResults.tasks?.length ?? 0) > 0 || (searchResults.projects?.length ?? 0) > 0 || (searchResults.users?.length ?? 0) > 0);

    return (
        <div className="p-8">
            <Header name={query ? `Search Results for "${query}"` : "Search"} />
            
            <div className="mt-6">
                {isLoading && <p className="text-gray-500 dark:text-gray-400">Searching...</p>}
                {isError && <p className="text-red-500">An error occurred while fetching search results.</p>}
                
                {!isLoading && !isError && query && !hasResults && (
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-12">No results found.</p>
                )}

                {!isLoading && !isError && hasResults && (
                    <div className="space-y-8">
                        {searchResults.projects && searchResults.projects?.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-2 dark:text-white">Projects</h2>
                                <div className="divide-y dark:divide-dark-tertiary rounded-lg border dark:border-dark-tertiary bg-white dark:bg-dark-secondary shadow-sm">
                                    {searchResults.projects.map((project) => (
                                        <ProjectSearchResult key={`proj-${project.id}`} project={project} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {searchResults.tasks && searchResults.tasks?.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-2 dark:text-white">Tasks</h2>
                                <div className="divide-y dark:divide-dark-tertiary rounded-lg border dark:border-dark-tertiary bg-white dark:bg-dark-secondary shadow-sm">
                                    {searchResults.tasks.map((task) => (
                                        <TaskSearchResult key={`task-${task.id}`} task={task} />
                                    ))}
                                </div>
                            </section>
                        )}

                         {searchResults.users && searchResults.users?.length > 0 && (
                             <section>
                                <h2 className="text-xl font-bold mb-2 dark:text-white">Users</h2>
                                <div className="divide-y dark:divide-dark-tertiary rounded-lg border dark:border-dark-tertiary bg-white dark:bg-dark-secondary shadow-sm">
                                    {searchResults.users.map((user) => (
                                        <UserSearchResult key={`user-${user.userId}`} user={user} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;