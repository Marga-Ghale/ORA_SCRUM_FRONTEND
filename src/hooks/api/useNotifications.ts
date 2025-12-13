/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/api/useNotifications.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_COMMENTED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'TASK_CREATED'
  | 'TASK_DELETED'
  | 'SPRINT_STARTED'
  | 'SPRINT_COMPLETED'
  | 'SPRINT_ENDING'
  | 'MENTION'
  | 'PROJECT_INVITATION'
  | 'WORKSPACE_INVITATION';

export interface NotificationData {
  taskId?: string;
  taskKey?: string;
  projectId?: string;
  sprintId?: string;
  commentId?: string;
  workspaceId?: string;
  action?: 'view_task' | 'view_project' | 'view_sprint' | 'view_workspace';
  oldStatus?: string;
  newStatus?: string;
  changes?: string[];
  daysUntilDue?: number;
  daysOverdue?: number;
  isOverdue?: boolean;
  completedTasks?: number;
  totalTasks?: number;
  daysRemaining?: number;
  mentionedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: NotificationData;
  createdAt: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

// Notification display configuration
export interface NotificationConfig {
  icon: string;
  color: string;
  bgColor: string;
  priority: number;
}

// ============================================
// Configuration
// ============================================

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  TASK_ASSIGNED: {
    icon: '📋',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    priority: 1,
  },
  TASK_UPDATED: {
    icon: '✏️',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    priority: 3,
  },
  TASK_COMMENTED: {
    icon: '💬',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    priority: 2,
  },
  TASK_STATUS_CHANGED: {
    icon: '🔄',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    priority: 3,
  },
  TASK_DUE_SOON: {
    icon: '⏰',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    priority: 1,
  },
  TASK_OVERDUE: {
    icon: '🚨',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    priority: 0,
  },
  TASK_CREATED: {
    icon: '✨',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    priority: 4,
  },
  TASK_DELETED: {
    icon: '🗑️',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    priority: 4,
  },
  SPRINT_STARTED: {
    icon: '🚀',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    priority: 1,
  },
  SPRINT_COMPLETED: {
    icon: '🎉',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    priority: 1,
  },
  SPRINT_ENDING: {
    icon: '⏳',
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    priority: 1,
  },
  MENTION: {
    icon: '@',
    color: 'text-brand-500',
    bgColor: 'bg-brand-100 dark:bg-brand-900/30',
    priority: 1,
  },
  PROJECT_INVITATION: {
    icon: '📁',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    priority: 1,
  },
  WORKSPACE_INVITATION: {
    icon: '🏢',
    color: 'text-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    priority: 1,
  },
};

// ============================================
// Helper Functions
// ============================================

export function getNotificationConfig(type: NotificationType): NotificationConfig {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.TASK_ASSIGNED;
}

export function getNotificationLink(notification: Notification): string {
  const data = notification.data;
  const action = data?.action;

  switch (action) {
    case 'view_task':
      if (data?.taskId && data?.projectId) {
        return `/project/${data.projectId}/board?task=${data.taskId}`;
      }
      break;
    case 'view_project':
      if (data?.projectId) {
        return `/project/${data.projectId}/board`;
      }
      break;
    case 'view_sprint':
      if (data?.sprintId) {
        return `/sprints/${data.sprintId}`;
      }
      break;
    case 'view_workspace':
      if (data?.workspaceId) {
        return `/workspace/${data.workspaceId}`;
      }
      break;
  }

  // Fallback based on available data
  if (data?.taskId && data?.projectId) {
    return `/project/${data.projectId}/board?task=${data.taskId}`;
  }
  if (data?.projectId) {
    return `/project/${data.projectId}/board`;
  }
  if (data?.sprintId) {
    return `/sprints/${data.sprintId}`;
  }
  if (data?.workspaceId) {
    return `/workspace/${data.workspaceId}`;
  }

  return '/';
}

export function sortNotificationsByPriority(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    const configA = getNotificationConfig(a.type);
    const configB = getNotificationConfig(b.type);

    // First sort by read status (unread first)
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }

    // Then by priority
    if (configA.priority !== configB.priority) {
      return configA.priority - configB.priority;
    }

    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (notifDate.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notifDate.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else if (notifDate > weekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
}

// ============================================
// API Hooks
// ============================================

// Get all notifications
export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiClient.get<Notification[]>('/notifications'),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: options?.enabled !== false,
    select: (data) => sortNotificationsByPriority(data),
  });
}

// Get unread notifications
export function useUnreadNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: () => apiClient.get<Notification[]>('/notifications?unread=true'),
    refetchInterval: 15000, // Refetch every 15 seconds
    select: (data) => sortNotificationsByPriority(data),
  });
}

// Get notification count
export function useNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.count(),
    queryFn: () => apiClient.get<NotificationCount>('/notifications/count'),
    refetchInterval: 15000,
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        queryKeys.notifications.count()
      );

      // Optimistically update notifications
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKeys.notifications.list(),
          previousNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }

      // Optimistically update count
      if (previousCount) {
        queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), {
          ...previousCount,
          unread: Math.max(0, previousCount.unread - 1),
        });
      }

      return { previousNotifications, previousCount };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.notifications.count(), context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        queryKeys.notifications.count()
      );

      // Optimistically mark all as read
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKeys.notifications.list(),
          previousNotifications.map((n) => ({ ...n, read: true }))
        );
      }

      if (previousCount) {
        queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), {
          ...previousCount,
          unread: 0,
        });
      }

      return { previousNotifications, previousCount };
    },
    onError: (_, __, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.notifications.count(), context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        queryKeys.notifications.count()
      );

      // Optimistically remove notification
      if (previousNotifications) {
        const notification = previousNotifications.find((n) => n.id === id);
        queryClient.setQueryData<Notification[]>(
          queryKeys.notifications.list(),
          previousNotifications.filter((n) => n.id !== id)
        );

        // Update count
        if (previousCount && notification) {
          queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), {
            total: previousCount.total - 1,
            unread: notification.read ? previousCount.unread : previousCount.unread - 1,
          });
        }
      }

      return { previousNotifications, previousCount };
    },
    onError: (_, __, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.notifications.count(), context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Clear all notifications
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.delete('/notifications'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        queryKeys.notifications.count()
      );

      // Optimistically clear all
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(), []);
      queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), {
        total: 0,
        unread: 0,
      });

      return { previousNotifications, previousCount };
    },
    onError: (_, __, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.notifications.count(), context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ============================================
// Notification Sound Hook
// ============================================

export function useNotificationSound() {
  const playSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a soft, pleasant ding
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Use a softer, higher frequency for a gentle "ding"
    oscillator.frequency.value = 587.33; // D5 note
    oscillator.type = 'sine';
    
    // Start very quiet and fade out quickly
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Much quieter (was 0.3)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

  return { playSound };
}

// ============================================
// Browser Notification Hook
// ============================================

export function useBrowserNotifications() {
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options,
      });
    }
  };

  const hasPermission = () => {
    return 'Notification' in window && Notification.permission === 'granted';
  };

  return { requestPermission, showNotification, hasPermission };
}