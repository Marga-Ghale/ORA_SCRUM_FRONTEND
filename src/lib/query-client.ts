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
  // Auth
  // ============================================
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // ============================================
  // Workspaces
  // ============================================
  workspaces: {
    all: ['workspaces'] as const,
    list: () => [...queryKeys.workspaces.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, 'detail', id] as const,
    spaces: (workspaceId: string) => [...queryKeys.workspaces.all, 'spaces', workspaceId] as const,
    teams: (workspaceId: string) => [...queryKeys.workspaces.all, 'teams', workspaceId] as const,
    channels: (workspaceId: string) =>
      [...queryKeys.workspaces.all, 'channels', workspaceId] as const,
  },

  // ============================================
  // Spaces
  // ============================================
  spaces: {
    all: ['spaces'] as const,
    list: () => [...queryKeys.spaces.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.spaces.all, 'detail', id] as const,
    byWorkspace: (workspaceId: string) =>
      [...queryKeys.spaces.all, 'workspace', workspaceId] as const,
    folders: (spaceId: string) => [...queryKeys.spaces.all, 'folders', spaceId] as const,
    projects: (spaceId: string) => [...queryKeys.spaces.all, 'projects', spaceId] as const,
  },

  // ============================================
  // Folders
  // ============================================
  folders: {
    all: ['folders'] as const,
    list: () => [...queryKeys.folders.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.folders.all, 'detail', id] as const,
    bySpace: (spaceId: string) => [...queryKeys.folders.all, 'space', spaceId] as const,
    byUser: () => [...queryKeys.folders.all, 'user'] as const,
    projects: (folderId: string) => [...queryKeys.folders.all, 'projects', folderId] as const,
  },

  // ============================================
  // Projects
  // ============================================
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
    bySpace: (spaceId: string) => [...queryKeys.projects.all, 'space', spaceId] as const,
    byFolder: (folderId: string) => [...queryKeys.projects.all, 'folder', folderId] as const,
    tasks: (projectId: string) => [...queryKeys.projects.all, 'tasks', projectId] as const,
    labels: (projectId: string) => [...queryKeys.projects.all, 'labels', projectId] as const,
    activities: (projectId: string) =>
      [...queryKeys.projects.all, 'activities', projectId] as const,
  },

  // ============================================
  // Tasks
  // ============================================
  tasks: {
    all: ['tasks'] as const,
    list: () => [...queryKeys.tasks.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    byProject: (projectId: string) => [...queryKeys.tasks.all, 'project', projectId] as const,
    myTasks: () => [...queryKeys.tasks.all, 'my'] as const,
    filtered: (filters: Record<string, unknown>) =>
      [...queryKeys.tasks.all, 'filter', filters] as const,
    subtasks: (taskId: string) => [...queryKeys.tasks.all, 'subtasks', taskId] as const,
    comments: (taskId: string) => [...queryKeys.tasks.all, 'comments', taskId] as const,
    attachments: (taskId: string) => [...queryKeys.tasks.all, 'attachments', taskId] as const,
    dependencies: (taskId: string) => [...queryKeys.tasks.all, 'dependencies', taskId] as const,
    blockedBy: (taskId: string) => [...queryKeys.tasks.all, 'blocked-by', taskId] as const,
    checklists: (taskId: string) => [...queryKeys.tasks.all, 'checklists', taskId] as const,
    activity: (taskId: string) => [...queryKeys.tasks.all, 'activity', taskId] as const,
    timeEntries: (taskId: string) => [...queryKeys.tasks.all, 'time', taskId] as const,
    totalTime: (taskId: string) => [...queryKeys.tasks.all, 'time-total', taskId] as const,
    activeTimer: () => [...queryKeys.tasks.all, 'timer', 'active'] as const,
  },

  // ============================================
  // Labels
  // ============================================
  labels: {
    all: ['labels'] as const,
    list: () => [...queryKeys.labels.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.labels.all, 'detail', id] as const,
    byProject: (projectId: string) => [...queryKeys.labels.all, 'project', projectId] as const,
  },

  // ============================================
  // Teams
  // ============================================
  teams: {
    all: ['teams'] as const,
    list: () => [...queryKeys.teams.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.teams.all, 'detail', id] as const,
    byWorkspace: (workspaceId: string) =>
      [...queryKeys.teams.all, 'workspace', workspaceId] as const,
    members: (teamId: string) => [...queryKeys.teams.all, 'members', teamId] as const,
  },

  // ============================================
  // Members (Unified)
  // ============================================
  members: {
    all: ['members'] as const,
    direct: (entityType: string, entityId: string) =>
      [...queryKeys.members.all, 'direct', entityType, entityId] as const,
    effective: (entityType: string, entityId: string) =>
      [...queryKeys.members.all, 'effective', entityType, entityId] as const,
    access: (entityType: string, entityId: string) =>
      [...queryKeys.members.all, 'access', entityType, entityId] as const,
    accessLevel: (entityType: string, entityId: string) =>
      [...queryKeys.members.all, 'access-level', entityType, entityId] as const,
    myMemberships: () => [...queryKeys.members.all, 'my', 'memberships'] as const,
    myAccess: () => [...queryKeys.members.all, 'my', 'access'] as const,
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
    byWorkspace: (workspaceId: string) =>
      [...queryKeys.invitations.all, 'workspace', workspaceId] as const,
    byProject: (projectId: string) => [...queryKeys.invitations.all, 'project', projectId] as const,
    stats: () => [...queryKeys.invitations.all, 'stats'] as const,
    link: (token: string) => [...queryKeys.invitations.all, 'link', token] as const,
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
    my: () => [...queryKeys.activities.all, 'my'] as const,
    byProject: (projectId: string) => [...queryKeys.activities.all, 'project', projectId] as const,
  },

  // ============================================
  // Users
  // ============================================
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    search: (query: string) => [...queryKeys.users.all, 'search', query] as const,
  },
};

// ============================================
// Helper Functions
// ============================================

export const invalidateEntity = (entity: keyof typeof queryKeys) => {
  queryClient.invalidateQueries({ queryKey: queryKeys[entity].all });
};

export const prefetchQuery = async <T>(queryKey: readonly unknown[], queryFn: () => Promise<T>) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5,
  });
};

export const setQueryData = <T>(
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T)
) => {
  queryClient.setQueryData(queryKey, updater);
};

export const getQueryData = <T>(queryKey: readonly unknown[]): T | undefined => {
  return queryClient.getQueryData(queryKey);
};

export const removeQuery = (queryKey: readonly unknown[]) => {
  queryClient.removeQueries({ queryKey });
};
