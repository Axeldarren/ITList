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
  userId: string;
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
    docUrl?: string;
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
    createdById?: string;
    updatedById?: string;
    deletedById?: string;
    ticket_id?: string;
    productOwnerUserId?: string;
    productOwner?: {
        userId: string;
        username: string;
    };
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

export interface TimelineProject extends Project {
    versions: ProjectVersion[];
    createdBy?: {
        username: string;
    };
}

export interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TimelineProjectsResponse {
    data: TimelineProject[];
    meta: {
        totalProjects: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface ProductMaintenancesResponse {
    data: ProductMaintenance[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    stats: {
        active: number;
        inactive: number;
        highPriority: number;
        thisMonth: number;
        totalMaintenances: number;
    }
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
    userId?: string;
    username: string;
    email: string;
    password?: string;
    NIK?: number;
    profilePictureUrl?: string;
    department?: string;
    role?: string;
    deletedAt?: string | null;
}

export interface Attachment {
    id: number;
    fileURL: string;
    fileName: string;
    taskId: number;
    uploadedById: string;
}

// Define the shape of a Comment
export interface Comment {
    id: number;
    text: string;
    taskId?: number; // Optional - either task or maintenance task
    maintenanceTaskId?: number; // Optional - either task or maintenance task  
    userId: string;
    parentId?: number; // For reply threading
    user?: User;
    replies?: Comment[];
    createdAt: string;
    updatedAt: string;
}

// --- NEW: Define the Team interface ---
export interface Team {
    id: number;
    teamName: string;
    projectManagerUserId?: string;
    users?: User[]; // Add the users array here
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
    authorUserId?: string;
    assignedUserId?: string;
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
  userId: string;
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
    projectManagerUserId?: string;
}

export interface AddAttachmentPayload {
    taskId: number;
    fileURL: string;
    fileName: string;
    uploadedById: string;
}

export interface Suggestion {
    text: string;
    type: 'Project' | 'Task';
}
export interface DeveloperStats {
    userId: string;
    username: string;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalTimeLogged: number; // in seconds
    totalStoryPoints: number;
    completedStoryPoints: number;
    role?: string;
}

export interface DeveloperStatsResponse {
    data: DeveloperStats[];
    meta: Meta;
}

export interface TimeLogsResponse {
    data: TimeLog[];
    meta: Meta;
}

export interface DeveloperAssignmentWithStats extends User {
    totalTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    underReviewTasks: number;
    tasks: Task[]; // Only preview tasks
}

export interface DeveloperAssignmentsResponse {
    data: DeveloperAssignmentWithStats[];
    meta: {
        totalUsers: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface MilestoneComment {
    id: number;
    content: string;
    createdAt: string;
    projectId: number;
    userId: string;
    user: {
        userId: string;
        username: string;
        profilePictureUrl?: string;
    };
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
    createdById: string;
    createdBy: {
        userId: string;
        username: string;
        profilePictureUrl?: string;
    };
    maintainers: ProductMaintainer[];
    maintenanceTasks: MaintenanceTask[];
    statusHistory?: Array<{ id: number; status: 'Planned' | 'Maintaining' | 'Finished'; changedAt: string; changedBy: { userId: string; username: string } }>
    _count?: {
        maintenanceTasks: number;
    };
}

export interface ProductMaintainer {
    id: number;
    productMaintenanceId: number;
    userId: string;
    role: string; // "Lead", "Maintainer", "Support"
    createdAt: string;
    user: {
        userId: string;
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
    assignedToId?: string;
    assignedTo?: {
        userId: string;
        username: string;
        profilePictureUrl?: string;
    };
    createdAt: string;
    updatedAt: string;
    createdById: string;
    createdBy: {
        userId: string;
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
    maintainerIds?: string[];
}

export interface UpdateProductMaintenancePayload {
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    maintainerIds?: string[];
}

export interface CreateMaintenanceTaskPayload {
    title: string;
    description?: string;
    priority?: string;
    type?: string;
    estimatedHours?: number;
    assignedToId?: string;
    ticket_id?: string;
}

export interface UpdateMaintenanceTaskPayload {
    title?: string;
    description?: string;
    priority?: string;
    type?: string;
    estimatedHours?: number;
    actualHours?: number;
    assignedToId?: string;
    ticket_id?: string;
}

export interface Tickets {
    ticket_id: string;
    description_ticket: string;
    created: string;
}

export enum NotificationType {
    TASK_DEADLINE_APPROACHING = 'TASK_DEADLINE_APPROACHING',
    TASK_OVERDUE = 'TASK_OVERDUE',
    PROJECT_AT_RISK = 'PROJECT_AT_RISK',
    COMMENT_ADDED = 'COMMENT_ADDED',
    MILESTONE_COMMENT_ADDED = 'MILESTONE_COMMENT_ADDED',
    MENTIONED = 'MENTIONED',
}

export interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    userId: string;
    taskId?: number;
    projectId?: number;
    commentId?: number;
    createdAt: string;
}

export interface NotificationsResponse {
    data: Notification[];
    meta: Meta;
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

    let finalArgs: string | FetchArgs = args as string | FetchArgs;
    if (useEncryption) {
        // IMPORTANT: We intentionally DO NOT encrypt multipart/form-data (FormData) bodies.
        // Encrypting those would turn the binary/file payload into JSON and multer on the server
        // would never see req.file, causing "No file uploaded." errors. We only encrypt JSON-like
        // bodies while still requesting encrypted responses via X-Encrypted for normal (non-upload) requests.
        if (typeof finalArgs === 'string') {
            // Simple GET string form – request encrypted response only
            finalArgs = { url: finalArgs, headers: { 'X-Encrypted': 'v1' } };
        } else if (typeof finalArgs === 'object' && finalArgs) {
            const newHeaders: Record<string, string> = {};
            if (finalArgs.headers) {
                if (finalArgs.headers instanceof Headers) {
                    finalArgs.headers.forEach((v, k) => { newHeaders[k] = v; });
                } else {
                    Object.assign(newHeaders, finalArgs.headers as Record<string, string>);
                }
            }

            const method = (finalArgs.method || 'GET').toUpperCase();
            const hasBody = typeof finalArgs.body !== 'undefined' && finalArgs.body !== null;
            const isFormData = hasBody && typeof FormData !== 'undefined' && finalArgs.body instanceof FormData;

            if (hasBody && !isFormData && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                // Encrypt ONLY JSON-like bodies; skip FormData so file uploads work
                newHeaders['X-Encrypted'] = 'v1';
                const envelope = await encryptJson(finalArgs.body as unknown);
                finalArgs = { ...finalArgs, headers: newHeaders, body: envelope };
            } else {
                // For GET or FormData (multipart) just request encrypted response for non-upload cases
                if (!isFormData) {
                    newHeaders['X-Encrypted'] = 'v1';
                }
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
    if (useEncryption && 'data' in result) {
        const possibleData = (result as { data?: unknown }).data;
        if (possibleData && isEncryptedEnvelope(possibleData as unknown)) {
            try {
                const decrypted = await decryptJson(possibleData as { iv: string; data: string; tag?: string });
                return { ...result, data: decrypted } as typeof result;
            } catch {
                // If decryption fails, return as-is; upstream can handle
            }
        }
    }
    // Decrypt error envelope (RTK Query shapes errors as result.error)
    if (useEncryption && 'error' in result) {
        type RTKErrorShape = { status?: number; data?: unknown };
        const possibleError = (result as { error?: RTKErrorShape }).error;
        if (possibleError && isEncryptedEnvelope(possibleError.data as unknown)) {
            try {
                const decryptedErr = await decryptJson(possibleError.data as { iv: string; data: string; tag?: string });
                const newError: RTKErrorShape = { ...possibleError, data: decryptedErr };
                return { ...(result as object), error: newError } as typeof result;
            } catch {
                // Silent fallback; deliver original encrypted error if decryption fails
            }
        }
    }
    return result;
};

export const api = createApi({
    baseQuery,
    reducerPath: 'api',
    tagTypes: ["Projects", "Tasks", "Users", "Teams", "Comments", "Attachments", "ProjectVersions", "SearchResults", "TimeLogs", "Activities", "RunningTimeLog", "ProductMaintenances", "MaintenanceTasks", "Tickets", "MilestoneComments", "Notifications"],
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
        getProjectVersionHistory: build.query<ProjectVersion[] | { data: ProjectVersion[]; meta: Meta }, { projectId: number; page?: number; limit?: number }>({
            query: ({ projectId, page, limit }) => {
                let url = `projects/${projectId}/versions`;
                if (page && limit) {
                    url += `?page=${page}&limit=${limit}`;
                }
                return url;
            },
            providesTags: (result, error, { projectId }) => {
                 return [{ type: 'ProjectVersions', id: projectId }];
            },
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
        getTimelineProjects: build.query<TimelineProjectsResponse, { page: number; limit: number; search?: string; status?: string; sort?: string }>({
            query: ({ page, limit, search, status, sort }) => {
                let url = `projects/timeline?page=${page}&limit=${limit}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (status && status !== 'all') url += `&status=${status}`;
                if (sort) url += `&sort=${sort}`;
                return url;
            },
            providesTags: (result) => 
                result 
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Projects' as const, id })), 
                        { type: 'Projects', id: 'LIST' },
                        { type: 'ProjectVersions', id: 'LIST' }
                    ]
                    : [{ type: 'Projects', id: 'LIST' }, { type: 'ProjectVersions', id: 'LIST' }],
        }),
        getMilestoneComments: build.query<MilestoneComment[], number>({
            query: (projectId) => `projects/${projectId}/milestone-comments`,
            providesTags: (result, error, projectId) => [
                { type: 'MilestoneComments', id: projectId },
            ],
        }),
        createMilestoneComment: build.mutation<MilestoneComment, { projectId: number; content: string }>({
            query: ({ projectId, content }) => ({
                url: `projects/${projectId}/milestone-comments`,
                method: 'POST',
                body: { content },
            }),
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'MilestoneComments', id: projectId },
            ],
        }),
        getProjectActivities: build.query<Activity[] | { data: Activity[]; meta: Meta }, { projectId: number; page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }>({
            query: ({ projectId, page, limit, search, startDate, endDate }) => {
                let url = `projects/${projectId}/activities`;
                const params = new URLSearchParams();
                if (page && limit) {
                    params.append('page', page.toString());
                    params.append('limit', limit.toString());
                }
                if (search) params.append('search', search);
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                
                if (Array.from(params).length > 0) {
                    url += `?${params.toString()}`;
                }
                return url;
            },
            providesTags: (result, error, { projectId }) => {
                return [{ type: 'Activities', id: projectId }];
            },
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
            // Optimistic update for instant UI feedback
            async onQueryStarted({ projectId, status }, { dispatch, queryFulfilled }) {
                // Optimistically update the project status in the cache
                const patchResult = dispatch(
                    api.util.updateQueryData('getProjects', undefined, (draft) => {
                        const project = draft.find((p: { id: number }) => p.id === projectId);
                        if (project) {
                            project.status = status as ProjectStatus;
                        }
                    })
                );
                try {
                    await queryFulfilled;
                    // After server confirms, force full cache refresh for consistency
                    dispatch(api.util.invalidateTags([
                        { type: 'Projects', id: 'LIST' },
                        { type: 'Projects', id: 'FINISHED' },
                        { type: 'Projects', id: projectId },
                        { type: 'Users' as const, id: 'LIST' },
                        { type: 'Tasks' as const, id: 'LIST' },
                        { type: 'TimeLogs' as const, id: 'LIST' }
                    ]));
                } catch {
                    // Revert optimistic update on failure
                    patchResult.undo();
                }
            },
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
        getTasks: build.query<Task[] | { data: Task[]; meta: Meta }, { projectId: number; version?: number; page?: number; limit?: number; search?: string }>({
            query: ({ projectId, version, page, limit, search }) => {
                let url = `tasks?projectId=${projectId}`;
                if (version) url += `&version=${version}`;
                if (page && limit) {
                     url += `&page=${page}&limit=${limit}`;
                }
                if (search) url += `&search=${encodeURIComponent(search)}`;
                return url;
            },
            providesTags: (result, error, { projectId }) => {
                 let tasks: Task[] = [];
                 if (Array.isArray(result)) {
                     tasks = result;
                 } else if (result && 'data' in result) {
                     tasks = result.data;
                 }
                 
                 return tasks
                    ? [
                        ...tasks.map(({ id }) => ({ type: 'Tasks' as const, id })),
                        { type: 'Tasks', id: 'LIST' },
                        { type: 'Tasks', id: `PROJECT_${projectId}` },
                    ]
                    : [
                        { type: 'Tasks', id: 'LIST' },
                        { type: 'Tasks', id: `PROJECT_${projectId}` }
                    ];
            },
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
        getDeveloperAssignments: build.query<DeveloperAssignmentsResponse, { page: number; limit: number; search?: string; sort?: string; filter?: string }>({
            query: ({ page, limit, search, sort, filter }) => {
                let url = `users/assignments?page=${page}&limit=${limit}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (sort) url += `&sort=${sort}`;
                if (filter) url += `&filter=${filter}`;
                return url;
            },
            providesTags: ['Users', 'Tasks'],
        }),
        getTasksByUser: build.query<Task[], { userId: string; assignedOnly?: boolean }>({
            query: ({ userId, assignedOnly }) => {
                let url = `tasks/user/${userId}`;
                if (assignedOnly) url += `?assignedOnly=true`;
                return url;
            },
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
        getUserById: build.query<User, string>({
            query: (userId) => `users/${userId}`,
            providesTags: (result, error, id) => [{ type: 'Users', id }],
        }),

        updateUser: build.mutation<User, Partial<User> & { userId: string }>({
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
        deleteUser: build.mutation<{ message: string }, string>({
            query: (userId) => ({
                url: `users/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Users', id: 'LIST' }],
        }),

        uploadProfilePicture: build.mutation<User, { userId: string; file: File }>({
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
        createComment: build.mutation<Comment, { taskId: number; text: string; userId: string }>({
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
        createStandaloneComment: build.mutation<Comment, { taskId: number; text: string; parentId?: number }>({
            query: (body) => ({
                url: 'comments/standalone',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { taskId }) => [
                { type: 'Tasks', id: taskId },
                { type: 'Activities' },
                { type: 'Comments', id: `task-${taskId}` },
            ],
        }),
        getTaskComments: build.query<Comment[], number>({
            query: (taskId) => `comments/task/${taskId}`,
            providesTags: (result, error, taskId) => [
                { type: 'Comments', id: `task-${taskId}` },
            ],
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

        getUserWeeklyStats: build.query<{ totalHours: number; totalStoryPoints: number; timeLogs: TimeLog[]; completedTasks: Task[] }, { userId: string; weekOffset?: number }>({
            query: ({ userId, weekOffset = 0 }) => ({
                url: `users/${userId}/weekly-stats`,
                params: { weekOffset }
            }),
            providesTags: ['Users', 'Tasks', 'TimeLogs'],
        }),

        getDeveloperStats: build.query<DeveloperStats[], { startMonth?: string; endMonth?: string; month?: string; projectId?: number }>({
            query: ({ startMonth, endMonth, month, projectId }) => ({
                url: 'productivity',
                params: { startMonth, endMonth, month, projectId },
            }),
            providesTags: ['Users', 'Tasks', 'TimeLogs'],
        }),

        getDeveloperStatsPaginated: build.query<DeveloperStatsResponse, { startMonth?: string; endMonth?: string; month?: string; projectId?: number; page: number; limit: number }>({
            query: ({ startMonth, endMonth, month, projectId, page, limit }) => ({
                url: 'productivity',
                params: { startMonth, endMonth, month, projectId, page, limit },
            }),
            providesTags: ['Users', 'Tasks', 'TimeLogs'],
        }),

        getTimeLogs: build.query<TimeLog[], { userId?: string; startMonth?: string; endMonth?: string; month?: string; projectId?: number }>({
            query: ({ userId, startMonth, endMonth, month, projectId }) => ({
                url: 'timelogs',
                params: { userId, startMonth, endMonth, month, projectId },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'TimeLogs' as const, id })),
                        { type: 'TimeLogs', id: 'LIST' },
                      ]
                    : [{ type: 'TimeLogs', id: 'LIST' }],
        }),

        getTimeLogsPaginated: build.query<TimeLogsResponse, { userId?: string; month?: string; page: number; limit: number }>({
            query: ({ userId, month, page, limit }) => ({
                url: 'timelogs',
                params: { userId, month, page, limit },
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'TimeLogs' as const, id })),
                        { type: 'TimeLogs', id: 'LIST' },
                      ]
                    : [{ type: 'TimeLogs', id: 'LIST' }],
        }),

        // Product Maintenance endpoints
        getProductMaintenances: build.query<ProductMaintenancesResponse, { page: number; limit: number; search?: string; status?: string; priority?: string }>({
            query: ({ page, limit, search, status, priority }) => ({
                url: 'product-maintenance',
                params: { page, limit, search, status, priority }
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'ProductMaintenances' as const, id })),
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
                                    { type: 'Comments' as const, id: 'LIST' }, // Comments might be related to project tasks
                                    { type: 'ProjectVersions' as const, id: 'LIST' } // Update timeline view
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

                            // Handle notification updates
                            if (data.type === 'NOTIFICATION') {
                                console.log('Received NOTIFICATION signal, invalidating tags...');
                                dispatch(api.util.invalidateTags([
                                    { type: 'Notifications' as const, id: 'LIST' },
                                    'Notifications',
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
        getTicketsWithStatusCR: build.query<Array<{ ticket_id: string; description_ticket: string }>, void>({
            query: () => 'osticket/tickets/status-cr',
            providesTags: ['Tickets'],
        }),
        getTicketsWithStatusOpen: build.query<Array<{ ticket_id: string; description_ticket: string }>, void>({
            query: () => 'osticket/tickets/status-open',
            providesTags: ['Tickets'],
        }),

        // --- Notification Endpoints ---
        getNotifications: build.query<NotificationsResponse, { page?: number; limit?: number; category?: string }>({
            query: ({ page = 1, limit = 20, category = 'all' }) => `notifications?page=${page}&limit=${limit}&category=${category}`,
            providesTags: [{ type: 'Notifications', id: 'LIST' }],
        }),
        getUnreadNotificationCount: build.query<{ count: number }, void>({
            query: () => 'notifications/unread-count',
            providesTags: [{ type: 'Notifications', id: 'LIST' }],
        }),
        markNotificationAsRead: build.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `notifications/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
        }),
        markAllNotificationsAsRead: build.mutation<{ message: string }, void>({
            query: () => ({
                url: 'notifications/read-all',
                method: 'PATCH',
            }),
            invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
        }),
        deleteNotification: build.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `notifications/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
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
    useGetTimelineProjectsQuery,
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
    useGetDeveloperStatsPaginatedQuery,
    useGetTimeLogsQuery,
    useGetTimeLogsPaginatedQuery,
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
    useGetMaintenanceTaskTimeLogsQuery,
    useGetMaintenanceTaskCommentsQuery,
    useStartMaintenanceTimerMutation,
    useStopMaintenanceTimerMutation,
    useCreateDevlogCommentMutation,
    useStopDevlogTimerMutation,
    useGetActiveDevlogsQuery,
    useWebSocketQuery,
    useGetAllRunningTimeLogsQuery,
    useGetTicketsWithStatusCRQuery,
    useGetTicketsWithStatusOpenQuery,
    useGetDeveloperAssignmentsQuery,
    useGetMilestoneCommentsQuery,
    useCreateMilestoneCommentMutation,
    useGetNotificationsQuery,
    useGetUnreadNotificationCountQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    useDeleteNotificationMutation,
    useCreateStandaloneCommentMutation,
    useGetTaskCommentsQuery
} = api;
