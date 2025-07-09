import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define all interfaces for your data
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
    teamId?: number;
}

export interface Attachment {
    id: number;
    fileUrl: string;
    fileName: string;
    taskId: number;
    uploadedById: number;
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

export const api = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
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
            // --- UPDATED: Invalidates both the project and its user list ---
            invalidatesTags: (result, error, { id }) => [
                { type: "Projects", id },
                { type: 'Users', id: `PROJECT_${id}` }
            ],
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
            invalidatesTags: (result, error, {taskId}) => [{ type: "Tasks", id: taskId }],
        }),
        
        // Other endpoints
        getTasksByUser: build.query<Task[], number>({
            query: (userId) => `tasks/user/${userId}`,
            providesTags: (result, error, userId) =>
                result
                ? result.map(({ id }) => ({ type: "Tasks", id }))
                : [{ type: "Tasks", id: userId }],
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
        getUsers: build.query<User[], void>({
            query: () => 'users',
            providesTags: ["Users"]
        }),
        getTeams: build.query<Team[], void>({
            query: () => 'teams',
            providesTags: ["Teams"]
        }),
        updateTask: build.mutation<Task, Partial<Task> & { id: number }>({
            query: ({ id, ...patch }) => ({
                url: `tasks/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Tasks', id }, { type: 'Tasks', id: 'LIST' }],
        }),
        createComment: build.mutation<Comment, Partial<Comment>>({
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
            invalidatesTags: (result, error, { id }) => [{ type: 'Tasks' }], // Refetch the task to show updated comment
        }),

        deleteComment: build.mutation<{ message: string }, number>({
            query: (commentId) => ({
                url: `comments/${commentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Tasks' }], // Refetch the task
        }),

        addAttachment: build.mutation<Attachment, FormData>({
            query: (formData) => ({
                url: `attachments`,
                method: 'POST',
                body: formData, 
            }),
            invalidatesTags: (result, error) => [{ type: 'Tasks' }],
        }),
        deleteAttachment: build.mutation<{ message: string }, number>({
            query: (attachmentId) => ({
                url: `attachments/${attachmentId}`,
                method: 'DELETE',
            }),
            // Invalidate all tasks to refetch and update the UI
            invalidatesTags: (result, error, attachmentId) => [{ type: 'Tasks' }],
        }),
    }),
});

export const {
    useGetProjectsQuery,
    useCreateProjectMutation,
    useDeleteProjectMutation,
    useUpdateProjectMutation,
    useGetTasksQuery,
    useGetTaskByIdQuery,
    useGetTasksByUserQuery,
    useCreateTaskMutation,
    useDeleteTaskMutation,
    useUpdateTaskStatusMutation,
    useIncrementProjectVersionMutation,
    useGetProjectUsersQuery,
    useSearchQuery,
    useGetUsersQuery,
    useGetTeamsQuery,
    useUpdateTaskMutation,
    useCreateCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
    useAddAttachmentMutation,
    useDeleteAttachmentMutation,
} = api;