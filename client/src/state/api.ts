import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/app/redux';
export interface Project {
    id: number;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    version: number;
    teamId?: number; 
}

export enum Priority {
    Urgent = 'Urgent',
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    Backlog = 'Backlog',
}

export enum Status {
    ToDo = 'To Do',
    WorkInProgress = "Work In Progress",
    UnderReview = "Under Review",
    Completed = "Completed",
}

export interface User {
    userId?: number;
    username: string;
    email: string;
    password?: string;
    NIK?: number;
    profilePictureUrl?: string;
    isAdmin?: boolean;
}

export interface Attachment {
    id: number;
    fileUrl: string;
    fileName: string;
    taskId: number;
    uploadedById: number;
}

// Define the shape of a Comment
export interface Comment {
    id: number;
    text: string;
    taskId: number;
    userId: number;
    user?: User;
}

// --- NEW: Define the Team interface ---
export interface Team {
    id: number;
    teamName: string;
    productOwnerUserId?: number;
    projectManagerUserId?: number;
    users?: User[]; // Add the users array here
    productOwnerUsername?: string;
    projectManagerUsername?: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    tags?: string;
    startDate?: string;
    dueDate?: string;
    points?: number;
    projectId: number;
    authorUserId?: number;
    assignedUserId?: number;
    version: number;
    author?: User;
    assignee?: User;
    comments?: Comment[];
    attachments?: Attachment[];
}

export interface SearchResults {
    tasks?: Task[];
    projects?: Project[];
    users?: User[];
}

export interface Team {
    id: number;
    teamName: string;
    productOwnerUserId?: number;
    projectManagerUserId?: number;
}

export interface AddAttachmentPayload {
    taskId: number;
    fileURL: string;
    fileName: string;
    uploadedById: number;
}

export interface Suggestion {
    text: string;
    type: 'Project' | 'Task';
}
const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

export const api = createApi({
    baseQuery,
    reducerPath: 'api',
    tagTypes: ["Projects", "Tasks", "Users", "Teams"],
    endpoints: (build) => ({
        getProjects: build.query<Project[], void>({
            query: () => 'projects',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Projects' as const, id })),
                        { type: 'Projects', id: 'LIST' },
                      ]
                    : [{ type: 'Projects', id: 'LIST' }],
        }),
        createProject: build.mutation<Project, Partial<Project>>({
            query: (project) => ({
                url: 'projects',
                method: 'POST',
                body: project
            }),
            invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
        }),
        deleteProject: build.mutation<{ message: string }, number>({
            query: (projectId) => ({
                url: `projects/${projectId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
        }),
        updateProject: build.mutation<Project, Partial<Project> & { id: number }>({
            query: ({ id, ...patch }) => ({
                url: `projects/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Projects", id },
                { type: 'Users', id: `PROJECT_${id}` }
            ],
        }),
        
        // --- NEW: Endpoint to get ALL tasks for the dashboard ---
        getAllTasks: build.query<Task[], void>({
            query: () => `tasks`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Tasks' as const, id })),
                        { type: 'Tasks', id: 'LIST' },
                      ]
                    : [{ type: 'Tasks', id: 'LIST' }],
        }),
        getTasks: build.query<Task[], { projectId: number }>({
            query: ({ projectId }) => `tasks?projectId=${projectId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Tasks' as const, id })),
                        { type: 'Tasks', id: 'LIST' },
                      ]
                    : [{ type: 'Tasks', id: 'LIST' }],
        }),
        getTaskById: build.query<Task, number>({
            query: (taskId) => `tasks/${taskId}`,
            providesTags: (result, error, id) => [{ type: 'Tasks', id }],
        }),
        createTask: build.mutation<Task, Partial<Task>>({
            query: (task) => ({
                url: 'tasks',
                method: 'POST',
                body: task
            }),
            invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
        }),
        deleteTask: build.mutation<{ message: string }, number>({
            query: (taskId) => ({
                url: `tasks/${taskId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
        }),
        updateTaskStatus: build.mutation<Task, {taskId: number; status: string}>({
            query: ({ taskId, status }) => ({
                url: `tasks/${taskId}/status`,
                method: 'PATCH',
                body: { status }
            }),
            invalidatesTags: [{ type: "Tasks", id: 'LIST' }],
        }),
        getTasksByUser: build.query<Task[], number>({
            query: (userId) => `tasks/user/${userId}`,
            // --- FIX: Add the 'LIST' tag here ---
            providesTags: (result) =>
                result
                ? [
                    ...result.map(({ id }) => ({ type: "Tasks" as const, id })),
                    { type: 'Tasks', id: 'LIST' },
                  ]
                : [{ type: 'Tasks', id: 'LIST' }],
        }),
        incrementProjectVersion: build.mutation<Project, { projectId: number }>({
            query: ({ projectId }) => ({
                url: `projects/${projectId}/version`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, { projectId }) => [{ type: "Projects", id: projectId }],
        }),
        getProjectUsers: build.query<User[], number>({
            query: (projectId) => `projects/${projectId}/users`,
            providesTags: (result, error, projectId) => [{ type: 'Users', id: `PROJECT_${projectId}` }],
        }),

        search: build.query<SearchResults, string>({
            query: ( query ) => `search?query=${query}`
        }),
        getSearchSuggestions: build.query<Suggestion[], { query: string; projectId?: number }>({
            query: ({ query, projectId }) => {
                let url = `search/suggestions?q=${query}`;
                if (projectId) {
                    url += `&projectId=${projectId}`;
                }
                return url;
            },
        }),

        getUsers: build.query<User[], void>({
            query: () => 'users',
            providesTags: ["Users"]
        }),
        getUserById: build.query<User, number>({
            query: (userId) => `users/${userId}`,
            providesTags: (result, error, id) => [{ type: 'Users', id }],
        }),

        updateUser: build.mutation<User, Partial<User> & { userId: number }>({
            query: ({ userId, ...patch }) => ({
                url: `users/${userId}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: 'Users', id: userId }],
        }),

        // --- NEW: Mutation for uploading a profile picture ---
        uploadProfilePicture: build.mutation<User, { userId: number; file: File }>({
            query: ({ userId, file }) => {
                const formData = new FormData();
                formData.append('profilePicture', file);
                return {
                    url: `users/${userId}/picture`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: (result, error, { userId }) => [{ type: 'Users', id: userId }],
        }),
        

        getTeams: build.query<Team[], void>({
            query: () => 'teams',
            providesTags: ["Teams"]
        }),

        // --- NEW: Team Mutations ---
        createTeam: build.mutation<Team, Partial<Team>>({
            query: (team) => ({
                url: 'teams',
                method: 'POST',
                body: team,
            }),
            invalidatesTags: ['Teams'],
        }),
        updateTeam: build.mutation<Team, Partial<Team> & { id: number }>({
            query: ({ id, ...patch }) => ({
                url: `teams/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: ['Teams'],
        }),
        deleteTeam: build.mutation<{ message: string }, number>({
            query: (teamId) => ({
                url: `teams/${teamId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Teams'],
        }),
        updateTask: build.mutation<Task, Partial<Task> & { id: number }>({
            query: ({ id, ...patch }) => ({
                url: `tasks/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Tasks', id }, { type: 'Tasks', id: 'LIST' }],
        }),
        createComment: build.mutation<Comment, Partial<Comment> & { taskId: number }>({
            query: (comment) => ({
                url: 'comments',
                method: 'POST',
                body: comment,
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'Tasks', id: taskId }],
        }),
        updateComment: build.mutation<Comment, { id: number; text: string }>({
            query: ({ id, ...patch }) => ({
                url: `comments/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: [{ type: 'Tasks' }],
        }),
        deleteComment: build.mutation<{ message: string }, number>({
            query: (commentId) => ({
                url: `comments/${commentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Tasks' }],
        }),
        addAttachment: build.mutation<Attachment, FormData>({
            query: (formData) => ({
                url: `attachments`,
                method: 'POST',
                body: formData, 
            }),
            invalidatesTags: [{ type: 'Tasks' }],
        }),
        deleteAttachment: build.mutation<{ message: string }, number>({
            query: (attachmentId) => ({
                url: `attachments/${attachmentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Tasks' }],
        }),
        login: build.mutation<{ token: string; data: { user: User } }, { email: string; password: string }>({
            query: (credentials) => ({
                url: 'auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        logout: build.mutation<{ status: string }, void>({
            query: () => 'auth/logout',
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useGetProjectsQuery,
    useCreateProjectMutation,
    useDeleteProjectMutation,
    useUpdateProjectMutation,
    useGetAllTasksQuery, // Export the new query
    useGetTasksQuery,
    useGetTaskByIdQuery,
    useGetTasksByUserQuery,
    useCreateTaskMutation,
    useDeleteTaskMutation,
    useUpdateTaskStatusMutation,
    useIncrementProjectVersionMutation,
    useGetProjectUsersQuery,
    useSearchQuery,
    useGetSearchSuggestionsQuery,
    useGetUsersQuery,
    useGetUserByIdQuery,
    useUpdateUserMutation,
    useUploadProfilePictureMutation,
    useGetTeamsQuery,
    useCreateTeamMutation,
    useUpdateTeamMutation,
    useDeleteTeamMutation,
    useUpdateTaskMutation,
    useCreateCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
    useAddAttachmentMutation,
    useDeleteAttachmentMutation,
} = api;