// src/hooks/api/useNotifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
  | 'WORKSPACE_INVITATION'
  | 'CHAT_MESSAGE';

export interface NotificationData {
  taskId?: string;
  taskKey?: string;
  projectId?: string;
  sprintId?: string;
  workspaceId?: string;
  channelId?: string;
  messageId?: string;
  commentId?: string;
  action?: 'view_task' | 'view_project' | 'view_sprint' | 'view_workspace' | 'view_chat';
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
  [key: string]: unknown;
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

export interface NotificationConfig {
  icon: string;
  color: string;
  bgColor: string;
  hexColor: string;
  hexBgColor: string;
  priority: number;
}

// ============================================
// Notification Configuration
// ============================================

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  TASK_ASSIGNED: {
    icon: '👤',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    hexColor: '#3b82f6',
    hexBgColor: '#3b82f620',
    priority: 1,
  },
  TASK_UPDATED: {
    icon: '✏️',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    hexColor: '#eab308',
    hexBgColor: '#eab30820',
    priority: 3,
  },
  TASK_COMMENTED: {
    icon: '💬',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    hexColor: '#22c55e',
    hexBgColor: '#22c55e20',
    priority: 2,
  },
  TASK_STATUS_CHANGED: {
    icon: '🔄',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    hexColor: '#a855f7',
    hexBgColor: '#a855f720',
    priority: 3,
  },
  TASK_DUE_SOON: {
    icon: '⏰',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    hexColor: '#f97316',
    hexBgColor: '#f9731620',
    priority: 1,
  },
  TASK_OVERDUE: {
    icon: '🚨',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    hexColor: '#ef4444',
    hexBgColor: '#ef444420',
    priority: 0,
  },
  TASK_CREATED: {
    icon: '✨',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/20',
    hexColor: '#6366f1',
    hexBgColor: '#6366f120',
    priority: 4,
  },
  TASK_DELETED: {
    icon: '🗑️',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/20',
    hexColor: '#6b7280',
    hexBgColor: '#6b728020',
    priority: 4,
  },
  SPRINT_STARTED: {
    icon: '🚀',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    hexColor: '#a855f7',
    hexBgColor: '#a855f720',
    priority: 1,
  },
  SPRINT_COMPLETED: {
    icon: '🎉',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    hexColor: '#22c55e',
    hexBgColor: '#22c55e20',
    priority: 1,
  },
  SPRINT_ENDING: {
    icon: '⏳',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    hexColor: '#f59e0b',
    hexBgColor: '#f59e0b20',
    priority: 1,
  },
  MENTION: {
    icon: '@',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/20',
    hexColor: '#ec4899',
    hexBgColor: '#ec489920',
    priority: 1,
  },
  PROJECT_INVITATION: {
    icon: '📨',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/20',
    hexColor: '#6366f1',
    hexBgColor: '#6366f120',
    priority: 1,
  },
  WORKSPACE_INVITATION: {
    icon: '🏢',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/20',
    hexColor: '#14b8a6',
    hexBgColor: '#14b8a620',
    priority: 1,
  },
  CHAT_MESSAGE: {
    icon: '💬',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    hexColor: '#22c55e',
    hexBgColor: '#22c55e20',
    priority: 2,
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get notification display configuration
 */
export function getNotificationConfig(type: NotificationType | string): NotificationConfig {
  return (
    NOTIFICATION_CONFIG[type as NotificationType] || {
      icon: '📌',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/20',
      hexColor: '#6b7280',
      hexBgColor: '#6b728020',
      priority: 5,
    }
  );
}

/**
 * Get navigation link for a notification
 */
export function getNotificationLink(notification: Notification): string {
  const { data } = notification;

  if (!data) return '/';

  switch (data.action) {
    case 'view_task':
      if (data.taskId && data.projectId) {
        return `/project/${data.projectId}/board?task=${data.taskId}`;
      }
      break;
    case 'view_project':
      if (data.projectId) {
        return `/project/${data.projectId}/board`;
      }
      break;
    case 'view_sprint':
      if (data.sprintId && data.projectId) {
        return `/project/${data.projectId}/sprints/${data.sprintId}`;
      }
      break;
    case 'view_workspace':
      if (data.workspaceId) {
        return `/workspace/${data.workspaceId}`;
      }
      break;
    case 'view_chat':
      if (data.channelId) {
        return `/chat/${data.channelId}`;
      }
      break;
  }

  // Fallback based on available data
  if (data.taskId && data.projectId) {
    return `/project/${data.projectId}/board?task=${data.taskId}`;
  }
  if (data.projectId) {
    return `/project/${data.projectId}/board`;
  }
  if (data.channelId) {
    return `/chat/${data.channelId}`;
  }

  return '/';
}

/**
 * Sort notifications by priority and date
 */
export function sortNotificationsByPriority(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    // Unread first
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }

    // Then by priority (lower = higher priority)
    const priorityA = getNotificationConfig(a.type).priority;
    const priorityB = getNotificationConfig(b.type).priority;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(
  notifications: Notification[]
): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let key: string;

    if (notifDate.getTime() >= today.getTime()) {
      key = 'Today';
    } else if (notifDate.getTime() >= yesterday.getTime()) {
      key = 'Yesterday';
    } else if (notifDate.getTime() >= lastWeek.getTime()) {
      key = 'This Week';
    } else {
      key = 'Earlier';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
  });

  return groups;
}

/**
 * Format notification time for display
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// Query Hooks
// ============================================

/**
 * Get all notifications with optional unread filter
 */
export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: [...queryKeys.notifications.list(), { unreadOnly }],
    queryFn: () =>
      apiClient.get<Notification[]>(`/notifications${unreadOnly ? '?unread=true' : ''}`),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    select: sortNotificationsByPriority,
  });
}

/**
 * Get only unread notifications
 */
export function useUnreadNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: () => apiClient.get<Notification[]>('/notifications?unread=true'),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    select: sortNotificationsByPriority,
  });
}

/**
 * Get notification counts
 */
export function useNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.count(),
    queryFn: () => apiClient.get<NotificationCount>('/notifications/count'),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Mark a single notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list()
      );
      const previousCount = queryClient.getQueryData<NotificationCount>(
        queryKeys.notifications.count()
      );

      // Optimistic update
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKeys.notifications.list(),
          previousNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }

      if (previousCount && previousCount.unread > 0) {
        queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), {
          ...previousCount,
          unread: previousCount.unread - 1,
        });
      }

      return { previousNotifications, previousCount };
    },
    onError: (_err, _id, context) => {
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

/**
 * Mark all notifications as read
 */
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

      // Optimistic update
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
    onSuccess: () => {
      toast.success('All notifications marked as read');
    },
    onError: (_err, _vars, context) => {
      toast.error('Failed to mark notifications as read');
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

/**
 * Delete a single notification
 */
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

      // Find the notification to check if it was unread
      const deletedNotification = previousNotifications?.find((n) => n.id === id);

      // Optimistic update
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKeys.notifications.list(),
          previousNotifications.filter((n) => n.id !== id)
        );
      }

      if (previousCount && deletedNotification) {
        queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), {
          total: Math.max(0, previousCount.total - 1),
          unread: deletedNotification.read
            ? previousCount.unread
            : Math.max(0, previousCount.unread - 1),
        });
      }

      return { previousNotifications, previousCount };
    },
    onError: (_err, _id, context) => {
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

/**
 * Delete all notifications
 */
export function useDeleteAllNotifications() {
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

      // Optimistic update
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(), []);
      queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), {
        total: 0,
        unread: 0,
      });

      return { previousNotifications, previousCount };
    },
    onSuccess: () => {
      toast.success('All notifications cleared');
    },
    onError: (_err, _vars, context) => {
      toast.error('Failed to clear notifications');
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

/**
 * Play notification sound
 */
export function useNotificationSound() {
  const playSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Soft, pleasant notification sound (D5 note)
      oscillator.frequency.value = 587.33;
      oscillator.type = 'sine';

      // Quick fade out
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.25);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  return { playSound };
}

// ============================================
// Browser Notification Hook
// ============================================

/**
 * Browser push notifications
 */
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

  const hasPermission = (): boolean => {
    return 'Notification' in window && Notification.permission === 'granted';
  };

  return { requestPermission, showNotification, hasPermission };
}

// ============================================
// Real-time Notification Hook
// ============================================

/**
 * Hook to handle real-time notifications via WebSocket
 */
export function useRealTimeNotifications(enabled = true) {
  const queryClient = useQueryClient();
  const { playSound } = useNotificationSound();
  const { showNotification, hasPermission } = useBrowserNotifications();

  const handleNewNotification = (notification: Notification) => {
    // Update cache
    queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(), (old) => {
      if (!old) return [notification];
      return sortNotificationsByPriority([notification, ...old]);
    });

    // Update count
    queryClient.setQueryData<NotificationCount>(queryKeys.notifications.count(), (old) => {
      if (!old) return { total: 1, unread: 1 };
      return {
        total: old.total + 1,
        unread: old.unread + 1,
      };
    });

    // Play sound
    playSound();

    // Show browser notification
    if (hasPermission()) {
      showNotification(notification.title, {
        body: notification.message,
        tag: notification.id,
      });
    }
  };

  return {
    enabled,
    handleNewNotification,
  };
}
