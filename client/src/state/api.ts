import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import { RootState } from '@/app/redux';
import { logOut } from './authSlice';
import { encryptJson, decryptJson, isEncryptedEnvelope } from '@/lib/crypto';

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
    prdUrl?: string;
    startDate?: string;
    endDate?: string;
    version: number;
    teamId?: number;
    status: ProjectStatus; 
    deletedAt?: string | null;
    totalTimeLogged?: number; // in seconds, includes both tasks and maintenance
    totalMaintenanceTimeLogged?: number; // in seconds, just maintenance tasks
    createdAt?: string;
    updatedAt?: string;
    createdById?: number;
    updatedById?: number;
    deletedById?: number;
    ticket_id?: string;
    projectTicket?: {
        ticket_id: string;
    };

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
    department?: string;
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
    taskId?: number; // Optional - either task or maintenance task
    maintenanceTaskId?: number; // Optional - either task or maintenance task  
    userId: number;
    user?: User;
    createdAt: string;
    updatedAt: string;
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
    updatedAt?: string;
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
  description?: string; // Added description field
  createdAt: string;
  taskId?: number; // Optional - either task or maintenance task
  maintenanceTaskId?: number; // Optional - either task or maintenance task
  userId: number;
  commentId?: number; // Link to associated comment
  user?: { username: string };
  task?: Task & { project?: Project };
  maintenanceTask?: MaintenanceTask;
  comment?: Comment; // Associated comment
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
    isAdmin?: boolean;
}

export interface ProductMaintenance {
    id: number;
    name: string;
    description?: string;
    status: "Active" | "Inactive"; // Updated to use enum values
    lifecycle?: 'Planned' | 'Maintaining' | 'Finished';
    priority?: string; // "Low", "Medium", "High", "Critical"
    totalTimeLogged?: number; // in seconds, calculated from all maintenance tasks
    projectId?: number;
    project?: {
        id: number;
        name: string;
        status: string;
    };
    createdAt: string;
    updatedAt: string;
    createdById: number;
    createdBy: {
        userId: number;
        username: string;
        profilePictureUrl?: string;
    };
    maintainers: ProductMaintainer[];
    maintenanceTasks: MaintenanceTask[];
    statusHistory?: Array<{ id: number; status: 'Planned' | 'Maintaining' | 'Finished'; changedAt: string; changedBy: { userId: number; username: string } }>
    _count?: {
        maintenanceTasks: number;
    };
}

export interface ProductMaintainer {
    id: number;
    productMaintenanceId: number;
    userId: number;
    role: string; // "Lead", "Maintainer", "Support"
    createdAt: string;
    user: {
        userId: number;
        username: string;
        profilePictureUrl?: string;
        email: string;
    };
}

export interface MaintenanceTask {
    id: number;
    title: string;
    description?: string;
    // Removed status field - tasks are now just logs/history
    priority?: string;
    type: string; // "Optimize Query", "Database Migration", etc.
    estimatedHours?: number;
    actualHours?: number;
    totalTimeLogged?: number; // in seconds, calculated from time logs
    productMaintenanceId: number;
    assignedToId?: number;
    assignedTo?: {
        userId: number;
        username: string;
        profilePictureUrl?: string;
    };
    createdAt: string;
    updatedAt: string;
    createdById: number;
    createdBy: {
        userId: number;
        username: string;
        profilePictureUrl?: string;
    };
    maintenanceTaskTicket?: {
        ticket_id: string;
    };
    ticket_id?: string;
    timeLogs?: TimeLog[]; // Uses unified TimeLog system
    comments?: Comment[]; // Uses unified Comment system
}

export interface CreateProductMaintenancePayload {
    name: string;
    description?: string;
    priority?: string;
    projectId?: number;
    maintainerIds?: number[];
}

export interface UpdateProductMaintenancePayload {
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    maintainerIds?: number[];
}

export interface CreateMaintenanceTaskPayload {
    title: string;
    description?: string;
    priority?: string;
    type?: string;
    estimatedHours?: number;
    assignedToId?: number;
    ticket_id?: string;
}

export interface UpdateMaintenanceTaskPayload {
    title?: string;
    description?: string;
    priority?: string;
    type?: string;
    estimatedHours?: number;
    actualHours?: number;
    assignedToId?: number;
    ticket_id?: string;
}

export interface Tickets {
    ticket_id: string;
    description_ticket: string;
    created: string;
}

const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

// Intercept 401/403 globally: clear auth so layout redirects to /login
const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
    const useEncryption = !!process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

    // Encrypt request body if JSON and encryption enabled
            let finalArgs: string | FetchArgs = args as string | FetchArgs;
            if (useEncryption) {
                if (typeof finalArgs === 'string') {
                    finalArgs = { url: finalArgs, headers: { 'X-Encrypted': 'v1' } };
                } else if (typeof finalArgs === 'object' && finalArgs) {
                    // Always ask server to encrypt responses
                    const newHeaders: Record<string, string> = {};
                    if (finalArgs.headers) {
                        if (finalArgs.headers instanceof Headers) {
                            finalArgs.headers.forEach((v, k) => { newHeaders[k] = v; });
                        } else {
                            Object.assign(newHeaders, finalArgs.headers as Record<string, string>);
                        }
                    }
                    newHeaders['X-Encrypted'] = 'v1';

                    const method = (finalArgs.method || 'GET').toUpperCase();
                    const hasBody = typeof finalArgs.body !== 'undefined' && finalArgs.body !== null;
                    if (hasBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                        const envelope = await encryptJson(finalArgs.body as unknown);
                        finalArgs = { ...finalArgs, headers: newHeaders, body: envelope };
                    } else {
                        finalArgs = { ...finalArgs, headers: newHeaders };
                    }
                }
            }

            const result = await rawBaseQuery(finalArgs, api, extraOptions);
    const status = (result as { error?: { status?: number } }).error?.status;
    if (status === 401 || status === 403) {
        // Clear auth state; Persist will update and dashboard layout will redirect on token missing
        api.dispatch(logOut());
    }
    // Decrypt successful JSON responses
            if (useEncryption && 'data' in result && result.data && isEncryptedEnvelope(result.data as unknown)) {
        try {
                    const decrypted = await decryptJson(result.data as { iv: string; data: string; tag?: string });
                    return { ...result, data: decrypted } as typeof result;
        } catch {
            // If decryption fails, return as-is; upstream can handle
        }
    }
    return result;
};

export const api = createApi({
    baseQuery,
    reducerPath: 'api',
    tagTypes: ["Projects", "Tasks", "Users", "Teams", "Comments", "Attachments", "ProjectVersions", "SearchResults", "TimeLogs", "Activities", "RunningTimeLog", "ProductMaintenances", "MaintenanceTasks", "Tickets"],
    endpoints: (build) => ({
        getAllRunningTimeLogs: build.query<TimeLog[], void>({
            query: () => 'timelogs/running/all',
            providesTags: ['TimeLogs'],
        }),
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

        createProject: build.mutation<Project, Partial<Project> & { ticket_id?: string }>({
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
        updateProject: build.mutation<Project, Partial<Project> & { id: number; ticket_id?: string }>({
            query: ({ id, ...patch }) => ({
                url: `projects/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            // Immediate cache invalidation for real-time updates
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Force immediate cache refresh
                    dispatch(api.util.invalidateTags([
                        { type: 'Projects', id: 'LIST' },
                        { type: 'Projects', id: 'FINISHED' }, // Include finished projects cache
                        { type: 'Projects', id },
                        { type: 'Users', id: `PROJECT_${id}` },
                        { type: 'Tasks' as const, id: 'LIST' }, // For task-related queries
                        { type: 'TimeLogs' as const, id: 'LIST' }, // For reporting-related queries
                        { type: 'Tickets' as const, id: 'LIST' } // For ticket-related queries
                    ]));
                } catch {
                    // Error handling if needed - just ignore for now
                }
            },
            invalidatesTags: (result, error, { id }) => [
                { type: "Projects", id },
                { type: 'Users', id: `PROJECT_${id}` },
                { type: "Tickets", id: 'LIST' } // Invalidate tickets list on project update
            ],
        }),

        updateProjectStatus: build.mutation<{ message: string }, { projectId: number; status: string }>({
            query: ({ projectId, status }) => ({
                url: `projects/${projectId}/status`,
                method: 'PATCH',
                body: { status },
            }),
            // Immediate cache invalidation for real-time updates
            async onQueryStarted({ projectId }, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Force immediate cache refresh
                    dispatch(api.util.invalidateTags([
                        { type: 'Projects', id: 'LIST' },
                        { type: 'Projects', id: 'FINISHED' }, // Invalidate finished projects for maintenance creation
                        { type: 'Projects', id: projectId },
                        { type: 'Users' as const, id: 'LIST' }, // For assignment-related queries
                        { type: 'Tasks' as const, id: 'LIST' }, // For task-related queries
                        { type: 'TimeLogs' as const, id: 'LIST' } // For reporting-related queries
                    ]));
                } catch {
                    // Error handling if needed - just ignore for now
                }
            },
            // Invalidate both the specific project and the main list to ensure UI consistency
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Projects', id: 'LIST' },
                { type: 'Projects', id: 'FINISHED' },
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
                { type: 'Activities', id: result?.projectId },
                // Add these tags to refresh developer productivity data
                'Users', // For developer stats
                'TimeLogs' // For time tracking stats
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
            invalidatesTags: (result) => [
                { type: 'Tasks' }, 
                { type: 'Activities', id: result?.projectId },
                // Add these tags to refresh developer productivity data
                'Users', // For developer stats
                'TimeLogs' // For time tracking stats
            ],
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
            invalidatesTags: (result, error, { taskId }) => [
                { type: 'Tasks', id: taskId }, 
                'RunningTimeLog',
                'TimeLogs' // For developer productivity stats
            ],
        }),

        stopTimer: build.mutation<TimeLog, { logId: number; commentText: string }>({
            query: (body) => ({
                url: 'timelogs/stop',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result) => result ? [
                { type: 'Tasks', id: result.taskId }, 
                "Activities", 
                'RunningTimeLog',
                'TimeLogs' // For developer productivity stats
            ] : [],
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

        getDeveloperStats: build.query<DeveloperStats[], { startMonth?: string; endMonth?: string; month?: string }>({
            query: ({ startMonth, endMonth, month }) => ({ // FIX: Destructure all parameters
                url: 'productivity',
                params: { startMonth, endMonth, month }, // FIX: Pass all parameters
            }),
            providesTags: ['Users', 'Tasks', 'TimeLogs'],
        }),

        getTimeLogs: build.query<TimeLog[], { userId?: number; month?: string }>({
            query: ({ userId, month }) => ({
                url: 'timelogs',
                params: { userId, month },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'TimeLogs' as const, id })),
                        { type: 'TimeLogs', id: 'LIST' },
                      ]
                    : [{ type: 'TimeLogs', id: 'LIST' }],
        }),

        // Product Maintenance endpoints
        getProductMaintenances: build.query<ProductMaintenance[], void>({
            query: () => 'product-maintenance',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'ProductMaintenances' as const, id })),
                        { type: 'ProductMaintenances', id: 'LIST' },
                      ]
                    : [{ type: 'ProductMaintenances', id: 'LIST' }],
        }),
        updateProductMaintenanceLifecycle: build.mutation<ProductMaintenance, { id: number; lifecycle: 'Planned' | 'Maintaining' | 'Finished' }>(
        {
            query: ({ id, lifecycle }) => ({
                url: `product-maintenance/${id}/lifecycle`,
                method: 'PATCH',
                body: { lifecycle },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ProductMaintenances', id },
                { type: 'ProductMaintenances', id: 'LIST' },
            ],
        }),

        getProductMaintenanceById: build.query<ProductMaintenance, number>({
            query: (id) => `product-maintenance/${id}`,
            providesTags: (result, error, id) => [{ type: 'ProductMaintenances', id }],
        }),

        getFinishedProjects: build.query<Project[], void>({
            query: () => 'product-maintenance/finished-projects',
            providesTags: [{ type: 'Projects', id: 'FINISHED' }],
        }),

        createProductMaintenance: build.mutation<ProductMaintenance, CreateProductMaintenancePayload>({
            query: (productMaintenance) => ({
                url: 'product-maintenance',
                method: 'POST',
                body: productMaintenance
            }),
            invalidatesTags: [{ type: 'ProductMaintenances', id: 'LIST' }],
        }),

        updateProductMaintenance: build.mutation<ProductMaintenance, { id: number } & UpdateProductMaintenancePayload>({
            query: ({ id, ...patch }) => ({
                url: `product-maintenance/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ProductMaintenances', id },
                { type: 'ProductMaintenances', id: 'LIST' },
            ],
        }),

        deleteProductMaintenance: build.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `product-maintenance/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'ProductMaintenances', id: 'LIST' }],
        }),

        createMaintenanceTask: build.mutation<MaintenanceTask, { productMaintenanceId: number } & CreateMaintenanceTaskPayload>({
            query: ({ productMaintenanceId, ...task }) => ({
                url: `product-maintenance/${productMaintenanceId}/tasks`,
                method: 'POST',
                body: task
            }),
            invalidatesTags: (result, error, { productMaintenanceId }) => [
                { type: 'ProductMaintenances', id: productMaintenanceId },
                { type: 'MaintenanceTasks', id: 'LIST' },
            ],
        }),

        updateMaintenanceTask: build.mutation<MaintenanceTask, { id: number } & UpdateMaintenanceTaskPayload>({
            query: ({ id, ...patch }) => ({
                url: `product-maintenance/tasks/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: [
                { type: 'MaintenanceTasks', id: 'LIST' },
                { type: 'ProductMaintenances', id: 'LIST' },
                { type: 'Tickets', id: 'LIST' }
            ],
        }),

        deleteMaintenanceTask: build.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `product-maintenance/tasks/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [
                { type: 'MaintenanceTasks', id: 'LIST' },
                { type: 'ProductMaintenances', id: 'LIST' },
            ],
        }),

        // Get time logs for maintenance task (uses unified TimeLog system)
        getMaintenanceTaskTimeLogs: build.query<TimeLog[], number>({
            query: (maintenanceTaskId) => `product-maintenance/tasks/${maintenanceTaskId}/time-logs`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'TimeLogs' as const, id })),
                        { type: 'TimeLogs', id: 'LIST' },
                    ]
                    : [{ type: 'TimeLogs', id: 'LIST' }],
        }),

        // Get comments for maintenance task
        getMaintenanceTaskComments: build.query<Comment[], number>({
            query: (maintenanceTaskId) => `comments/maintenance-task/${maintenanceTaskId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Comments' as const, id })),
                        { type: 'Comments', id: 'LIST' },
                    ]
                    : [{ type: 'Comments', id: 'LIST' }],
        }),

        // Start timer for maintenance task (uses unified TimeLog system)  
        startMaintenanceTimer: build.mutation<TimeLog, { maintenanceTaskId: number; description?: string }>({
            query: ({ maintenanceTaskId, description }) => ({
                url: `product-maintenance/tasks/${maintenanceTaskId}/timer/start`,
                method: 'POST',
                body: { description },
            }),
            invalidatesTags: [
                { type: 'TimeLogs', id: 'LIST' },
                { type: 'MaintenanceTasks', id: 'LIST' },
            ],
        }),

        // Stop timer for maintenance task (uses unified TimeLog system)
        stopMaintenanceTimer: build.mutation<{ timeLog: TimeLog; comment: Comment }, { maintenanceTaskId: number; workDescription: string }>({
            query: ({ maintenanceTaskId, workDescription }) => ({
                url: `product-maintenance/tasks/${maintenanceTaskId}/timer/stop`,
                method: 'POST', 
                body: { workDescription },
            }),
            invalidatesTags: [
                { type: 'TimeLogs', id: 'LIST' },
                { type: 'MaintenanceTasks', id: 'LIST' },
                { type: 'Comments', id: 'LIST' },
            ],
        }),

        // Devlog endpoints
        createDevlogComment: build.mutation<Comment, { text: string; taskId: number }>({
            query: (comment) => ({
                url: 'comments/devlog',
                method: 'POST',
                body: comment,
            }),
            invalidatesTags: [{ type: 'Comments', id: 'LIST' }],
        }),

        stopDevlogTimer: build.mutation<Comment, number>({
            query: (commentId) => ({
                url: `comments/${commentId}/stop-devlog`,
                method: 'PATCH',
            }),
            invalidatesTags: [{ type: 'Comments', id: 'LIST' }],
        }),

        getActiveDevlogs: build.query<Comment[], void>({
            query: () => 'comments/active-devlogs',
            providesTags: [{ type: 'Comments', id: 'ACTIVE_DEVLOGS' }],
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
                                    { type: 'Users' as const, id: 'LIST' }, // For assignment page updates
                                    { type: 'TimeLogs' as const, id: 'LIST' } // For productivity stats
                                ]));
                            }

                            // Handle general project list updates
                            if (data.type === 'PROJECT_UPDATE') {
                                const tags = [
                                    { type: 'Projects' as const, id: 'LIST' },
                                    { type: 'Projects' as const, id: 'FINISHED' }, // Add finished projects cache invalidation
                                    { type: 'Users' as const, id: 'LIST' }, // Assignment page might need project data
                                    { type: 'TimeLogs' as const, id: 'LIST' }, // Productivity stats might need project data
                                    { type: 'Tasks' as const, id: 'LIST' }, // Tasks are related to projects
                                    { type: 'Comments' as const, id: 'LIST' } // Comments might be related to project tasks
                                ];
                                
                                if (data.projectId) {
                                    tags.push({ type: 'Projects' as const, id: data.projectId });
                                }
                                
                                dispatch(api.util.invalidateTags(tags));
                            }

                            // Handle user list updates
                            if (data.type === 'USER_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    { type: 'Users', id: 'LIST' },
                                    { type: 'TimeLogs' as const, id: 'LIST' } // User changes affect productivity stats
                                ]));
                            }

                            // Handle team list updates
                            if (data.type === 'TEAM_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    { type: 'Teams', id: 'LIST' },
                                    { type: 'Users' as const, id: 'LIST' } // Team changes might affect user assignments
                                ]));
                            }

                            // Handle time log updates (for real-time productivity)
                            if (data.type === 'TIMELOG_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    { type: 'TimeLogs' as const, id: 'LIST' },
                                    { type: 'Users' as const, id: 'LIST' }, // For productivity stats
                                    { type: 'Tasks', id: 'LIST' } // Tasks might have updated time logs
                                ]));
                            }

                            // Handle product maintenance updates
                            if (data.type === 'PRODUCT_MAINTENANCE_UPDATE') {
                                dispatch(api.util.invalidateTags([
                                    { type: 'ProductMaintenances', id: 'LIST' },
                                ]));
                                if (data.productMaintenanceId) {
                                    dispatch(api.util.invalidateTags([
                                        { type: 'ProductMaintenances', id: data.productMaintenanceId }
                                    ]));
                                }
                            }

                            // Handle maintenance task updates
                            if (data.type === 'MAINTENANCE_TASK_UPDATE') {
                                const tags = [
                                    { type: 'MaintenanceTasks' as const, id: 'LIST' },
                                    { type: 'ProductMaintenances' as const, id: 'LIST' },
                                ];
                                
                                if (data.taskId) {
                                    tags.push({ type: 'MaintenanceTasks' as const, id: data.taskId });
                                }
                                
                                if (data.productMaintenanceId) {
                                    tags.push({ type: 'ProductMaintenances' as const, id: data.productMaintenanceId });
                                }
                                
                                dispatch(api.util.invalidateTags(tags));
                            }

                            // Handle maintenance time log updates (now uses unified TimeLogs)
                            if (data.type === 'MAINTENANCE_TIME_LOG_UPDATE') {
                                const tags = [
                                    { type: 'TimeLogs' as const, id: 'LIST' },
                                    { type: 'ProductMaintenances' as const, id: 'LIST' },
                                    { type: 'MaintenanceTasks' as const, id: 'LIST' },
                                ];
                                
                                if (data.timeLogId) {
                                    tags.push({ type: 'TimeLogs' as const, id: data.timeLogId });
                                }
                                
                                if (data.productMaintenanceId) {
                                    tags.push({ type: 'ProductMaintenances' as const, id: data.productMaintenanceId });
                                }
                                
                                dispatch(api.util.invalidateTags(tags));
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
        getTicketsWithStatusCR: build.query<Array<{ ticket_id: string; description_ticket: string }>, void>({
            query: () => 'osticket/tickets/status-cr',
            providesTags: ['Tickets'],
        }),
        getTicketsWithStatusOpen: build.query<Array<{ ticket_id: string; description_ticket: string }>, void>({
            query: () => 'osticket/tickets/status-open',
            providesTags: ['Tickets'],
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
    useGetTimeLogsQuery,
    useGetProductMaintenancesQuery,
    useGetProductMaintenanceByIdQuery,
    useGetFinishedProjectsQuery,
    useCreateProductMaintenanceMutation,
    useUpdateProductMaintenanceLifecycleMutation,
    useUpdateProductMaintenanceMutation,
    useDeleteProductMaintenanceMutation,
    useCreateMaintenanceTaskMutation,
    useUpdateMaintenanceTaskMutation,
    useDeleteMaintenanceTaskMutation,
    // Unified Timer System hooks (works for both tasks and maintenance)
    useGetMaintenanceTaskTimeLogsQuery,
    useGetMaintenanceTaskCommentsQuery,
    useStartMaintenanceTimerMutation,
    useStopMaintenanceTimerMutation,
    // Devlog hooks (kept for compatibility)
    useCreateDevlogCommentMutation,
    useStopDevlogTimerMutation,
    useGetActiveDevlogsQuery,
    useWebSocketQuery,
    // ...existing hooks...
    useGetAllRunningTimeLogsQuery,
    useGetTicketsWithStatusCRQuery,
    useGetTicketsWithStatusOpenQuery
} = api;