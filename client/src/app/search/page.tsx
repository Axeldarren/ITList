"use client";

import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import TaskCard from '@/components/TaskCard';
import UserCard from '@/components/UserCard';
import { useSearchQuery } from '@/state/api';
import { debounce } from 'lodash';
import React, { useEffect, useState } from 'react';

const Search = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: searchResults, isLoading, isError } = useSearchQuery(searchTerm, {
        skip: searchTerm.length < 3
    })

    const handleSearch = debounce(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setSearchTerm(event.target.value);
        },
        500,
    );

    useEffect(() => {
    return handleSearch.cancel;
    }, [handleSearch.cancel]);

    return (
        <div className="p-8">
            <Header name="Search" />
            <div>
                <input
                    type="text"
                    placeholder="Search for tasks, projects, or users..."
                    // Added dark mode classes for background, border, text, and placeholder
                    className="w-1/2 rounded border border-gray-300 p-3 shadow-sm dark:bg-dark-secondary dark:border-stroke-dark dark:text-white dark:placeholder-gray-400"
                    onChange={handleSearch}
                />
            </div>
            <div className="p-5">
                {isLoading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
                {isError && <p className="text-red-500">Error occurred while fetching search results.</p>}
                {!isLoading && !isError && searchResults && (
                    <div className="mt-6 space-y-8">
                        {searchResults.tasks && searchResults.tasks?.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4 dark:text-white">Tasks</h2>
                                <div className="space-y-4">
                                    {searchResults.tasks?.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {searchResults.projects && searchResults.projects?.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4 dark:text-white">Projects</h2>
                                <div className="space-y-4">
                                    {searchResults.projects?.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {searchResults.users && searchResults.users?.length > 0 && (
                             <section>
                                <h2 className="text-xl font-bold mb-4 dark:text-white">Users</h2>
                                <div className="space-y-4">
                                    {searchResults.users?.map((user) => (
                                        <UserCard key={user.userId} user={user} />
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