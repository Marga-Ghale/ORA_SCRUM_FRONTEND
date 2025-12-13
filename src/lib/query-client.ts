// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list: (projectId: string, filters?: any) => [...queryKeys.tasks.lists(), projectId, filters] as const,
    backlog: (projectId: string) => [...queryKeys.tasks.all, 'backlog', projectId] as const,
    bySprint: (sprintId: string) => [...queryKeys.tasks.all, 'sprint', sprintId] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    comments: (taskId: string) => [...queryKeys.tasks.all, 'comments', taskId] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (spaceId: string) => [...queryKeys.projects.lists(), spaceId] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
    members: (projectId: string) => [...queryKeys.projects.all, 'members', projectId] as const,
  },
  
  // Sprints
  sprints: {
    all: ['sprints'] as const,
    lists: () => [...queryKeys.sprints.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.sprints.lists(), projectId] as const,
    active: (projectId: string) => [...queryKeys.sprints.all, 'active', projectId] as const,
    detail: (id: string) => [...queryKeys.sprints.all, 'detail', id] as const,
  },
  
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  
  // Spaces
  spaces: {
    all: ['spaces'] as const,
    lists: () => [...queryKeys.spaces.all, 'list'] as const,
    list: (workspaceId: string) => [...queryKeys.spaces.lists(), workspaceId] as const,
    detail: (id: string) => [...queryKeys.spaces.all, 'detail', id] as const,
  },
  
  // Workspaces
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, 'detail', id] as const,
    members: (workspaceId: string) => [...queryKeys.workspaces.all, 'members', workspaceId] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    current: ['users', 'current'] as const,
    byProject: (projectId: string) => [...queryKeys.users.all, 'project', projectId] as const,
    byWorkspace: (workspaceId: string) => [...queryKeys.users.all, 'workspace', workspaceId] as const,
  },
  
  // Labels
  labels: {
    all: ['labels'] as const,
    lists: () => [...queryKeys.labels.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.labels.lists(), projectId] as const,
    detail: (id: string) => [...queryKeys.labels.all, 'detail', id] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: () => [...queryKeys.notifications.lists()] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    count: () => [...queryKeys.notifications.all, 'count'] as const,
    detail: (id: string) => [...queryKeys.notifications.all, 'detail', id] as const,
  },
};