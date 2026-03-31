"use client";

import Header from '@/components/Header';
import { useSearchQuery, Project, Task, User } from '@/state/api';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Briefcase, User as UserIcon, CheckSquare, Search as SearchIcon, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/app/redux';
import { selectCurrentUser } from '@/state/authSlice';

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

const UserSearchResult = ({ user, isAdmin }: { user: User; isAdmin: boolean }) => {
    const content = (
        <div className="flex items-center gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{user.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                {user.department && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{user.department}</p>
                )}
            </div>
        </div>
    );

    if (isAdmin) {
        return (
            <Link href="/users" className="block p-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                {content}
            </Link>
        );
    }

    return <div className="p-4 rounded-lg cursor-default">{content}</div>;
};

const Search = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const currentUser = useAppSelector(selectCurrentUser);
    const isAdmin = currentUser?.role === 'ADMIN';

    const [inputValue, setInputValue] = useState(query);

    const { data: searchResults, isLoading, isError } = useSearchQuery(query, {
        skip: !query,
    });

    const hasResults = searchResults && (
        (searchResults.tasks?.length ?? 0) > 0 ||
        (searchResults.projects?.length ?? 0) > 0 ||
        (searchResults.users?.length ?? 0) > 0
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        }
    };

    return (
        <div className="p-8">
            <Header name={query ? `Results for "${query}"` : "Search"} />

            {/* Refinement input */}
            <form onSubmit={handleSearch} className="mt-4 mb-6">
                <div className="relative max-w-xl">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="search"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Refine your search…"
                        className="w-full rounded-xl bg-white dark:bg-dark-secondary ring-1 ring-gray-200 dark:ring-white/10 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-400/50 transition-all"
                    />
                </div>
            </form>

            <div>
                {isLoading && <p className="text-gray-500 dark:text-gray-400">Searching...</p>}
                {isError && <p className="text-red-500">An error occurred while fetching search results.</p>}

                {!isLoading && !isError && query && !hasResults && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <SearchX className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No results for &ldquo;{query}&rdquo;</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try different keywords or check your spelling.</p>
                    </div>
                )}

                {!query && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <SearchIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Enter a term above to search</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Search across projects, tasks, and users.</p>
                    </div>
                )}

                {!isLoading && !isError && hasResults && (
                    <div className="space-y-8">
                        {(searchResults.projects?.length ?? 0) > 0 && (
                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                                    Projects <span className="ml-1 text-blue-primary">{searchResults.projects!.length}</span>
                                </h2>
                                <div className="divide-y dark:divide-dark-tertiary rounded-xl border border-gray-200 dark:border-dark-tertiary bg-white dark:bg-dark-secondary shadow-sm">
                                    {searchResults.projects!.map((project) => (
                                        <ProjectSearchResult key={`proj-${project.id}`} project={project} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {(searchResults.tasks?.length ?? 0) > 0 && (
                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                                    Tasks <span className="ml-1 text-blue-primary">{searchResults.tasks!.length}</span>
                                </h2>
                                <div className="divide-y dark:divide-dark-tertiary rounded-xl border border-gray-200 dark:border-dark-tertiary bg-white dark:bg-dark-secondary shadow-sm">
                                    {searchResults.tasks!.map((task) => (
                                        <TaskSearchResult key={`task-${task.id}`} task={task} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {(searchResults.users?.length ?? 0) > 0 && (
                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                                    Users <span className="ml-1 text-blue-primary">{searchResults.users!.length}</span>
                                </h2>
                                <div className="divide-y dark:divide-dark-tertiary rounded-xl border border-gray-200 dark:border-dark-tertiary bg-white dark:bg-dark-secondary shadow-sm">
                                    {searchResults.users!.map((user) => (
                                        <UserSearchResult key={`user-${user.userId}`} user={user} isAdmin={isAdmin} />
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
