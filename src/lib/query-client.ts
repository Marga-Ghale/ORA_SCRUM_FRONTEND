// src/lib/query-client.ts
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
  // ============================================
  // Tasks
  // ============================================
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, unknown>) => 
      [...queryKeys.tasks.lists(), projectId, filters] as const,
    backlog: (projectId: string) => [...queryKeys.tasks.all, 'backlog', projectId] as const,
    bySprint: (sprintId: string) => [...queryKeys.tasks.all, 'sprint', sprintId] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    comments: (taskId: string) => [...queryKeys.tasks.all, 'comments', taskId] as const,
    watchers: (taskId: string) => [...queryKeys.tasks.all, 'watchers', taskId] as const,
  },

  // ============================================
  // Projects
  // ============================================
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    bySpace: (spaceId: string) => [...queryKeys.projects.lists(), spaceId] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
    members: (projectId: string) => [...queryKeys.projects.all, 'members', projectId] as const,
    invitations: (projectId: string) => [...queryKeys.projects.all, 'invitations', projectId] as const,
  },

  // ============================================
  // Sprints
  // ============================================
  sprints: {
    all: ['sprints'] as const,
    lists: () => [...queryKeys.sprints.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.sprints.lists(), projectId] as const,
    active: (projectId: string) => [...queryKeys.sprints.all, 'active', projectId] as const,
    detail: (id: string) => [...queryKeys.sprints.all, 'detail', id] as const,
  },

  // ============================================
  // Auth
  // ============================================
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // ============================================
  // Spaces
  // ============================================
  spaces: {
    all: ['spaces'] as const,
    lists: () => [...queryKeys.spaces.all, 'list'] as const,
    list: (workspaceId: string) => [...queryKeys.spaces.lists(), workspaceId] as const,
    detail: (id: string) => [...queryKeys.spaces.all, 'detail', id] as const,
  },

  // ============================================
  // Workspaces
  // ============================================
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    list: () => [...queryKeys.workspaces.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, 'detail', id] as const,
    members: (workspaceId: string) => [...queryKeys.workspaces.all, 'members', workspaceId] as const,
    invitations: (workspaceId: string) => [...queryKeys.workspaces.all, 'invitations', workspaceId] as const,
  },

  // ============================================
  // Users
  // ============================================
  users: {
    all: ['users'] as const,
    current: ['users', 'current'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    search: (query: string) => [...queryKeys.users.all, 'search', query] as const,
    byProject: (projectId: string) => [...queryKeys.users.all, 'project', projectId] as const,
    byWorkspace: (workspaceId: string) => [...queryKeys.users.all, 'workspace', workspaceId] as const,
  },

  // ============================================
  // Labels
  // ============================================
  labels: {
    all: ['labels'] as const,
    lists: () => [...queryKeys.labels.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.labels.lists(), projectId] as const,
    detail: (id: string) => [...queryKeys.labels.all, 'detail', id] as const,
  },

  // ============================================
  // Notifications
  // ============================================
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: { unreadOnly?: boolean }) => 
      [...queryKeys.notifications.lists(), filters] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    count: () => [...queryKeys.notifications.all, 'count'] as const,
    detail: (id: string) => [...queryKeys.notifications.all, 'detail', id] as const,
  },

  // ============================================
  // Invitations
  // ============================================
  invitations: {
    all: ['invitations'] as const,
    pending: () => [...queryKeys.invitations.all, 'pending'] as const,
    workspace: (workspaceId: string) => [...queryKeys.invitations.all, 'workspace', workspaceId] as const,
    project: (projectId: string) => [...queryKeys.invitations.all, 'project', projectId] as const,
    detail: (id: string) => [...queryKeys.invitations.all, 'detail', id] as const,
  },

  // ============================================
  // Teams
  // ============================================
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    byWorkspace: (workspaceId: string) => [...queryKeys.teams.all, 'workspace', workspaceId] as const,
    detail: (id: string) => [...queryKeys.teams.all, 'detail', id] as const,
    members: (teamId: string) => [...queryKeys.teams.all, 'members', teamId] as const,
  },

  // ============================================
  // Chat
  // ============================================
  chat: {
    all: ['chat'] as const,
    // Channels
    channels: () => [...queryKeys.chat.all, 'channels'] as const,
    workspaceChannels: (workspaceId: string) => 
      [...queryKeys.chat.all, 'channels', 'workspace', workspaceId] as const,
    channel: (channelId: string) => [...queryKeys.chat.all, 'channel', channelId] as const,
    channelByTarget: (targetType: string, targetId: string) => 
      [...queryKeys.chat.all, 'channel', 'target', targetType, targetId] as const,
    // Messages
    messages: (channelId: string, limit?: number, offset?: number) => 
      [...queryKeys.chat.all, 'messages', channelId, { limit, offset }] as const,
    thread: (parentId: string) => [...queryKeys.chat.all, 'thread', parentId] as const,
    // Members
    members: (channelId: string) => [...queryKeys.chat.all, 'members', channelId] as const,
    // Unread
    unreadCounts: () => [...queryKeys.chat.all, 'unread'] as const,
    unreadCount: (channelId: string) => [...queryKeys.chat.all, 'unread', channelId] as const,
    // Reactions
    reactions: (messageId: string) => [...queryKeys.chat.all, 'reactions', messageId] as const,
    // Direct messages
    directChannel: (user1Id: string, user2Id: string) => 
      [...queryKeys.chat.all, 'direct', user1Id, user2Id] as const,
  },

  // ============================================
  // Activities
  // ============================================
  activities: {
    all: ['activities'] as const,
    lists: () => [...queryKeys.activities.all, 'list'] as const,
    byTask: (taskId: string) => [...queryKeys.activities.all, 'task', taskId] as const,
    byProject: (projectId: string) => [...queryKeys.activities.all, 'project', projectId] as const,
    byUser: (userId?: string) => [...queryKeys.activities.all, 'user', userId] as const,
    byWorkspace: (workspaceId: string) => [...queryKeys.activities.all, 'workspace', workspaceId] as const,
  },

  // ============================================
  // Comments
  // ============================================
  comments: {
    all: ['comments'] as const,
    byTask: (taskId: string) => [...queryKeys.comments.all, 'task', taskId] as const,
    detail: (id: string) => [...queryKeys.comments.all, 'detail', id] as const,
  },

  // ============================================
  // Search
  // ============================================
  search: {
    all: ['search'] as const,
    global: (query: string) => [...queryKeys.search.all, 'global', query] as const,
    tasks: (query: string, projectId?: string) => 
      [...queryKeys.search.all, 'tasks', query, projectId] as const,
    users: (query: string, scope?: { workspaceId?: string; projectId?: string }) => 
      [...queryKeys.search.all, 'users', query, scope] as const,
  },

  // ============================================
  // Dashboard / Analytics
  // ============================================
  dashboard: {
    all: ['dashboard'] as const,
    stats: (projectId?: string) => [...queryKeys.dashboard.all, 'stats', projectId] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recent'] as const,
    myTasks: () => [...queryKeys.dashboard.all, 'my-tasks'] as const,
    upcomingDeadlines: () => [...queryKeys.dashboard.all, 'deadlines'] as const,
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Invalidate all queries for a specific entity
 */
export const invalidateEntity = (entity: keyof typeof queryKeys) => {
  queryClient.invalidateQueries({ queryKey: queryKeys[entity].all });
};

/**
 * Prefetch a query
 */
export const prefetchQuery = async <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Set query data directly (for optimistic updates)
 */
export const setQueryData = <T>(
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T)
) => {
  queryClient.setQueryData(queryKey, updater);
};

/**
 * Get cached query data
 */
export const getQueryData = <T>(queryKey: readonly unknown[]): T | undefined => {
  return queryClient.getQueryData(queryKey);
};

/**
 * Remove query from cache
 */
export const removeQuery = (queryKey: readonly unknown[]) => {
  queryClient.removeQueries({ queryKey });
};