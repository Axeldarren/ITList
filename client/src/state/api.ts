import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/app/redux';

export interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  projectId: number;
  userId: number;
  taskId?: number;
  user: {
    username: string;
    profilePictureUrl?: string;
  };
  task?: {
    title: string;
  };
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    version: number;
    teamId?: number;
    status: ProjectStatus; 
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdById?: number;
    updatedById?: number;
    deletedById?: number;

    versions?: ProjectVersion[];
}

export interface ProjectVersion {
    id: number;
    version: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    archivedAt: string;
    projectId: number;
    status: ProjectStatus; // Add status to ProjectVersion
}

export enum Priority {
    Urgent = 'Urgent',
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    Backlog = 'Backlog',
}

export enum ProjectStatus {
  Start = 'Start',
  OnProgress = 'OnProgress',
  Resolve = 'Resolve',
  Finish = 'Finish',
  Cancel = 'Cancel',
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
    deletedAt?: string | null;
}

export interface Attachment {
    id: number;
    fileURL: string;
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
    createdAt?: string;
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
    timeLogs?: TimeLog[];
    project?: {
        id: number;
        name: string;
        deletedAt?: string | null;
    };
}

export interface TimeLog {
  id: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  createdAt: string;
  taskId: number;
  userId: number;
  user?: { username: string };
  task?: Task & { project?: Project };
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
export interface DeveloperStats {
    userId: number;
    username: string;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalTimeLogged: number; // in seconds
    totalStoryPoints: number;
    completedStoryPoints: number;
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
    tagTypes: ["Projects", "Tasks", "Users", "Teams", "Comments", "Attachments", "ProjectVersions", "SearchResults", "TimeLogs", "Activities", "RunningTimeLog"],
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
        getProjectVersionHistory: build.query<ProjectVersion[], number>({
            query: (projectId) => `projects/${projectId}/versions`,
            providesTags: (result, error, projectId) => [{ type: 'ProjectVersions', id: projectId }],
        }),
        getAllProjectVersions: build.query<ProjectVersion[], void>({
            query: () => 'projects/versions',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'ProjectVersions' as const, id })),
                        { type: 'ProjectVersions', id: 'LIST' },
                    ]
                    : [{ type: 'ProjectVersions', id: 'LIST' }],
        }),
        getProjectActivities: build.query<Activity[], number>({
            query: (projectId) => `projects/${projectId}/activities`,
            providesTags: (result, error, projectId) => [{ type: 'Activities', id: projectId }],
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

        updateProjectStatus: build.mutation<{ message: string }, { projectId: number; status: string }>({
            query: ({ projectId, status }) => ({
                url: `projects/${projectId}/status`,
                method: 'PATCH',
                body: { status },
            }),
            // Invalidate both the specific project and the main list to ensure UI consistency
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Projects', id: 'LIST' },
                { type: 'Projects', id: projectId }
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
        getTasks: build.query<Task[], { projectId: number; version?: number }>({
            query: ({ projectId, version }) => {
                let url = `tasks?projectId=${projectId}`;
                if (version) {
                    url += `&version=${version}`;
                }
                return url;
            },
            providesTags: (result, error, { projectId }) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Tasks' as const, id })),
                        { type: 'Tasks', id: 'LIST' },
                        { type: 'Tasks', id: `PROJECT_${projectId}` }, // Add project-specific tag
                    ]
                    : [
                        { type: 'Tasks', id: 'LIST' },
                        { type: 'Tasks', id: `PROJECT_${projectId}` }
                    ],
        }),
        getTaskById: build.query<Task, number>({
            query: (taskId) => `tasks/${taskId}`,
            providesTags: (result, error, taskId) => [{ type: 'Tasks', id: taskId }],
        }),
        createTask: build.mutation<Task, Partial<Task>>({
            query: (task) => ({
                url: 'tasks',
                method: 'POST',
                body: task
            }),
            invalidatesTags: (result) => [{ type: 'Tasks', id: 'LIST' }, { type: 'Activities', id: result?.projectId }],
        }),
        deleteTask: build.mutation<{ message: string }, number>({
            query: (taskId) => ({
                url: `tasks/${taskId}`,
                method: 'DELETE',
            }),
            invalidatesTags: () => [{ type: 'Tasks' }, { type: 'Activities' }],
        }),
        updateTaskStatus: build.mutation<Task, {taskId: number; status: string}>({
            query: ({ taskId, status }) => ({
                url: `tasks/${taskId}/status`,
                method: 'PATCH',
                body: { status }
            }),
            invalidatesTags: (result) => [
                { type: "Tasks", id: 'LIST' }, 
                { type: 'Tasks', id: `PROJECT_${result?.projectId}` }, // Add project-specific invalidation
                { type: 'Activities', id: result?.projectId }
            ],
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
        archiveAndIncrementVersion: build.mutation<Project, { projectId: number; startDate: string; endDate: string; }>({
            query: ({ projectId, startDate, endDate }) => ({
                url: `projects/${projectId}/archive`,
                method: 'POST',
                body: { startDate, endDate }, // Send the dates in the body
            }),
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Projects', id: projectId },
                { type: 'Projects', id: 'LIST' },
                { type: 'ProjectVersions', id: projectId },
                { type: 'Tasks', id: 'LIST' } // Invalidate tasks to refetch
            ],
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
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ userId }) => ({ type: 'Users' as const, id: userId })),
                        { type: 'Users', id: 'LIST' },
                      ]
                    : [{ type: 'Users', id: 'LIST' }],
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
            invalidatesTags: (result, error, { userId }) => [
                { type: 'Users', id: 'LIST' }, 
                { type: 'Users', id: userId }
            ],
        }),

        createUser: build.mutation<User, Partial<User>>({
            query: (newUser) => ({
                url: 'users',
                method: 'POST',
                body: newUser,
            }),
            invalidatesTags: ['Users'], // Invalidate the Users tag to refetch the list
        }),
        deleteUser: build.mutation<{ message: string }, number>({
            query: (userId) => ({
                url: `users/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Users', id: 'LIST' }],
        }),

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
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Teams' as const, id })),
                        { type: 'Teams', id: 'LIST' },
                      ]
                    : [{ type: 'Teams', id: 'LIST' }],
        }),

        createTeam: build.mutation<Team, Partial<Team>>({
            query: (team) => ({
                url: 'teams',
                method: 'POST',
                body: team,
            }),
            invalidatesTags: [{ type: 'Teams', id: 'LIST' }],
        }),
        updateTeam: build.mutation<Team, Partial<Team> & { id: number }>({
            query: ({ id, ...patch }) => ({
                url: `teams/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: [{ type: 'Teams', id: 'LIST' }],
        }),
        deleteTeam: build.mutation<{ message: string }, number>({
            query: (teamId) => ({
                url: `teams/${teamId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Teams', id: 'LIST' }],
        }),
        updateTask: build.mutation<Task, Partial<Task> & { id: number }>({
            query: ({ id, ...patch }) => ({
                url: `tasks/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (result) => [{ type: 'Tasks' }, { type: 'Activities', id: result?.projectId }],
        }),
        createComment: build.mutation<Comment, { taskId: number; text: string; userId: number }>({
            query: (body) => ({
                url: 'comments',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'Tasks', id: taskId }, { type: 'Activities' }],
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

        getTaskTimeLogs: build.query<TimeLog[], number>({
            query: (taskId) => `tasks/${taskId}/timelogs`, // You'll need to create this simple GET endpoint
            providesTags: (result) => result ? [...result.map(({ id }) => ({ type: 'TimeLogs' as const, id }))] : [],
        }),
        startTimer: build.mutation<TimeLog, { taskId: number }>({
            query: (body) => ({
                url: 'timelogs/start',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'Tasks', id: taskId }, 'RunningTimeLog'],
        }),

        stopTimer: build.mutation<TimeLog, { logId: number; commentText: string }>({
            query: (body) => ({
                url: 'timelogs/stop',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result) => result ? [{ type: 'Tasks', id: result.taskId }, "Activities", 'RunningTimeLog'] : [],
        }),
        getRunningTimeLog: build.query<TimeLog | null, void>({
            query: () => 'timelogs/running',
            providesTags: ['RunningTimeLog'],
        }),

        getUserWeeklyStats: build.query<{ totalHours: number; totalStoryPoints: number; timeLogs: TimeLog[]; completedTasks: Task[] }, { userId: number; weekOffset?: number }>({
            query: ({ userId, weekOffset = 0 }) => ({
                url: `users/${userId}/weekly-stats`,
                params: { weekOffset }
            }),
            providesTags: ['Users', 'Tasks', 'TimeLogs'],
        }),

        getDeveloperStats: build.query<DeveloperStats[], { month?: string }>({
            query: ({ month }) => ({
                url: 'productivity',
                params: { month }, // Pass the month as a query parameter
            }),
            providesTags: ['Users', 'Tasks', 'TimeLogs'],
        }),

        webSocket: build.query<null, void>({
            queryFn: () => ({ data: null }), // Use queryFn instead of query to avoid URL construction
            async onCacheEntryAdded(
                arg,
                { cacheDataLoaded, cacheEntryRemoved, dispatch }
            ) {
                // Fix: Connect directly to the WebSocket server root, not /ws endpoint
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
                const wsUrl = baseUrl.replace(/^http/, 'ws');
                
                const ws = new WebSocket(wsUrl);

                try {
                    await cacheDataLoaded;

                    // Wait for WebSocket to open before adding listeners
                    await new Promise<void>((resolve, reject) => {
                        ws.onopen = () => {
                            resolve();
                        };
                        ws.onerror = (error) => {
                            console.error('WebSocket connection failed:', error);
                            reject(error);
                        };
                        ws.onclose = (event) => {
                            if (event.code !== 1000) {
                                console.warn('WebSocket closed unexpectedly:', event.code, event.reason);
                            }
                        };
                    });

                    const listener = (event: MessageEvent) => {
                        try {
                            const data = JSON.parse(event.data);
                            
                            // Handle task/activity updates for a specific project
                            if (data.type === 'UPDATE' && data.projectId) {
                                dispatch(api.util.invalidateTags([
                                    { type: 'Tasks', id: 'LIST' }, // Invalidate the main task list
                                    { type: 'Tasks', id: `PROJECT_${data.projectId}` }, // Project-specific tasks
                                    { type: 'Activities', id: data.projectId }, // Activities for the project
                                    'Users', // For assignment page updates
                                    'TimeLogs' // For productivity stats
                                ]));
                            }

                            // Handle general project list updates
                            if (data.type === 'PROJECT_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    { type: 'Projects', id: 'LIST' },
                                    'Users', // Assignment page might need project data
                                    'TimeLogs' // Productivity stats might need project data
                                ]));
                                if (data.projectId) {
                                     dispatch(api.util.invalidateTags([{ type: 'Projects', id: data.projectId }]));
                                }
                            }

                            // Handle user list updates
                            if (data.type === 'USER_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    { type: 'Users', id: 'LIST' },
                                    'TimeLogs' // User changes affect productivity stats
                                ]));
                            }

                            // Handle team list updates
                            if (data.type === 'TEAM_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    { type: 'Teams', id: 'LIST' },
                                    'Users' // Team changes might affect user assignments
                                ]));
                            }

                            // Handle time log updates (for real-time productivity)
                            if (data.type === 'TIMELOG_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    'TimeLogs',
                                    'Users', // For productivity stats
                                    { type: 'Tasks', id: 'LIST' } // Tasks might have updated time logs
                                ]));
                            }
                        } catch (error) {
                            console.error('Error parsing WebSocket message:', error);
                        }
                    };

                    ws.addEventListener('message', listener);

                    // Clean up when cache entry is removed
                    await cacheEntryRemoved;
                    ws.removeEventListener('message', listener);
                } catch (error) {
                    console.error('WebSocket setup failed:', error);
                } finally {
                    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                    }
                }
            },
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
    useUpdateProjectStatusMutation,
    useArchiveAndIncrementVersionMutation,
    useGetProjectVersionHistoryQuery,
    useGetAllProjectVersionsQuery,
    useGetProjectActivitiesQuery,
    useGetAllTasksQuery,
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
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
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
    useGetTaskTimeLogsQuery,
    useStartTimerMutation,
    useStopTimerMutation,
    useGetRunningTimeLogQuery,
    useGetUserWeeklyStatsQuery,
    useGetDeveloperStatsQuery,
    useWebSocketQuery,
} = api;