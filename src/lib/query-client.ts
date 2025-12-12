import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Workspaces
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.workspaces.lists(), filters] as const,
    details: () => [...queryKeys.workspaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workspaces.details(), id] as const,
    members: (id: string) => [...queryKeys.workspaces.detail(id), 'members'] as const,
  },

  // Spaces
  spaces: {
    all: ['spaces'] as const,
    lists: () => [...queryKeys.spaces.all, 'list'] as const,
    list: (workspaceId: string) => [...queryKeys.spaces.lists(), workspaceId] as const,
    details: () => [...queryKeys.spaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.spaces.details(), id] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (spaceId: string) => [...queryKeys.projects.lists(), spaceId] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    members: (id: string) => [...queryKeys.projects.detail(id), 'members'] as const,
  },

  // Sprints
  sprints: {
    all: ['sprints'] as const,
    lists: () => [...queryKeys.sprints.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.sprints.lists(), projectId] as const,
    details: () => [...queryKeys.sprints.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sprints.details(), id] as const,
    active: (projectId: string) => [...queryKeys.sprints.list(projectId), 'active'] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.tasks.lists(), projectId, filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    comments: (id: string) => [...queryKeys.tasks.detail(id), 'comments'] as const,
    attachments: (id: string) => [...queryKeys.tasks.detail(id), 'attachments'] as const,
    byStatus: (projectId: string, status: string) =>
      [...queryKeys.tasks.list(projectId), 'status', status] as const,
    bySprint: (sprintId: string) => [...queryKeys.tasks.all, 'sprint', sprintId] as const,
    backlog: (projectId: string) => [...queryKeys.tasks.list(projectId), 'backlog'] as const,
  },

  // Labels
  labels: {
    all: ['labels'] as const,
    list: (projectId: string) => [...queryKeys.labels.all, projectId] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (workspaceId?: string) => [...queryKeys.users.lists(), workspaceId] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    count: () => [...queryKeys.notifications.all, 'count'] as const,
  },
};

export default queryClient;
