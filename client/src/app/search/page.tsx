"use client";

import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import TaskCard from '@/components/TaskCard';
import UserCard from '@/components/UserCard';
import { useSearchQuery } from '@/state/api';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import React from 'react';

const Search = () => {
    // Get search query from URL
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const { data: searchResults, isLoading, isError } = useSearchQuery(query, {
        skip: !query,
    });

    return (
        <div className="p-8">
            <Header name={`Search Results for "${query}"`} />
            
            <div className="p-5">
                {isLoading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
                {isError && <p className="text-red-500">Error occurred while fetching search results.</p>}
                
                {!isLoading && !isError && !searchResults && query && (
                    <p className="text-gray-500 dark:text-gray-400">No results found.</p>
                )}

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