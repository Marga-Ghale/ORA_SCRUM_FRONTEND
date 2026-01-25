/* eslint-disable no-case-declarations */
// ✅ COMPLETE REPLACEMENT: src/hooks/api/useNotifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '../../lib/query-client';
import apiClient from '../../lib/api';
import {
  Pencil,
  MessageSquare,
  RefreshCw,
  Clock,
  AlertTriangle,
  Trash2,
  Rocket,
  PartyPopper,
  Hourglass,
  AtSign,
  Mail,
  Building2,
  Pin,
  LucideIcon,
  UserPlus,
  Plus,
  UserMinus,
} from 'lucide-react';

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
  | 'CHAT_MESSAGE'
  | 'CHAT_ADDED_TO_CHANNEL'
  | 'CHAT_REMOVED_FROM_CHANNEL'
  | 'CHAT_MENTION';

export interface NotificationData {
  taskId?: string;
  taskKey?: string;
  taskTitle?: string;
  projectId?: string;
  sprintId?: string;
  sprintName?: string;
  spaceId?: string;
  workspaceId?: string;
  workspaceName?: string;
  projectName?: string;
  channelId?: string;
  messageId?: string;
  commentId?: string;
  action?: 'view_task' | 'view_project' | 'view_sprint' | 'view_workspace' | 'view_chat';
  oldStatus?: string;
  newStatus?: string;
  changes?: string[];
  daysUntilDue?: number;
  daysOverdue?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
  completedTasks?: number;
  totalTasks?: number;

  // ✅ NEW: User info fields
  createdBy?: string;
  createdByName?: string;
  assignedBy?: string;
  assignedByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  changedBy?: string;
  changedByName?: string;
  commentedBy?: string;
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
  icon: LucideIcon;
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
    icon: UserPlus,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    hexColor: '#9333ea',
    hexBgColor: '#9333ea20',
    priority: 1,
  },
  TASK_UPDATED: {
    icon: Pencil,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    hexColor: '#4f46e5',
    hexBgColor: '#4f46e520',
    priority: 3,
  },
  TASK_COMMENTED: {
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    hexColor: '#16a34a',
    hexBgColor: '#16a34a20',
    priority: 2,
  },
  TASK_STATUS_CHANGED: {
    icon: RefreshCw,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    hexColor: '#d97706',
    hexBgColor: '#d9770620',
    priority: 3,
  },
  TASK_DUE_SOON: {
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    hexColor: '#ea580c',
    hexBgColor: '#ea580c20',
    priority: 1,
  },
  TASK_OVERDUE: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    hexColor: '#dc2626',
    hexBgColor: '#dc262620',
    priority: 0,
  },
  TASK_CREATED: {
    icon: Plus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    hexColor: '#2563eb',
    hexBgColor: '#2563eb20',
    priority: 4,
  },
  TASK_DELETED: {
    icon: Trash2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    hexColor: '#4b5563',
    hexBgColor: '#4b556320',
    priority: 4,
  },
  SPRINT_STARTED: {
    icon: Rocket,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    hexColor: '#059669',
    hexBgColor: '#05966920',
    priority: 1,
  },
  SPRINT_COMPLETED: {
    icon: PartyPopper,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    hexColor: '#db2777',
    hexBgColor: '#db277720',
    priority: 1,
  },
  SPRINT_ENDING: {
    icon: Hourglass,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    hexColor: '#ca8a04',
    hexBgColor: '#ca8a0420',
    priority: 1,
  },
  MENTION: {
    icon: AtSign,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    hexColor: '#0891b2',
    hexBgColor: '#0891b220',
    priority: 1,
  },
  PROJECT_INVITATION: {
    icon: Mail,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    hexColor: '#7c3aed',
    hexBgColor: '#7c3aed20',
    priority: 1,
  },
  WORKSPACE_INVITATION: {
    icon: Building2,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    hexColor: '#0d9488',
    hexBgColor: '#0d948820',
    priority: 1,
  },
  CHAT_MESSAGE: {
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    hexColor: '#16a34a',
    hexBgColor: '#16a34a20',
    priority: 2,
  },
  CHAT_ADDED_TO_CHANNEL: {
    icon: UserPlus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    hexColor: '#2563eb',
    hexBgColor: '#2563eb20',
    priority: 2,
  },
  CHAT_REMOVED_FROM_CHANNEL: {
    icon: UserMinus,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    hexColor: '#ea580c',
    hexBgColor: '#ea580c20',
    priority: 3,
  },
  CHAT_MENTION: {
    icon: AtSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    hexColor: '#9333ea',
    hexBgColor: '#9333ea20',
    priority: 1,
  },
};

// ============================================
// Helper Functions
// ============================================

export function getNotificationConfig(type: NotificationType | string): NotificationConfig {
  return (
    NOTIFICATION_CONFIG[type as NotificationType] || {
      icon: Pin,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/20',
      hexColor: '#6b7280',
      hexBgColor: '#6b728020',
      priority: 5,
    }
  );
}

/**
 * ✅ ENHANCED: Format notification message with user names
 */
// ✅ UPDATED: Format notification message - Show detailed changes
export function formatNotificationMessage(notification: Notification): {
  title: string;
  message: string;
} {
  const data = notification.data || {};

  switch (notification.type) {
    case 'TASK_UPDATED':
      // ✅ Use changeDetails if available (detailed breakdown)
      if (
        data.changeDetails &&
        Array.isArray(data.changeDetails) &&
        data.changeDetails.length > 0
      ) {
        const details = data.changeDetails as string[];
        let detailMessage = '';

        if (details.length === 1) {
          detailMessage = details[0];
        } else if (details.length === 2) {
          detailMessage = `${details[0]} and ${details[1]}`;
        } else if (details.length === 3) {
          detailMessage = `${details[0]}, ${details[1]}, and ${details[2]}`;
        } else {
          // Show all changes for 4+ items
          const allButLast = details.slice(0, -1).join(', ');
          detailMessage = `${allButLast}, and ${details[details.length - 1]}`;
        }

        return {
          title: 'Task Updated',
          message: data.updatedByName
            ? `${data.updatedByName} updated "${data.taskTitle || 'task'}": ${detailMessage}`
            : `"${data.taskTitle || 'Task'}" updated: ${detailMessage}`,
        };
      }

      // Fallback to old format if changeDetails not available
      const changes = Array.isArray(data.changes) ? data.changes : [];
      const changeText = changes.length > 0 ? changes.join(', ') : 'updated';
      return {
        title: 'Task Updated',
        message: data.updatedByName
          ? `${data.updatedByName} updated "${data.taskTitle || 'a task'}": ${changeText}`
          : `"${data.taskTitle || 'Task'}" was updated: ${changeText}`,
      };

    case 'TASK_CREATED':
      return {
        title: 'New Task Created',
        message: data.createdByName
          ? `${data.createdByName} created: ${data.taskTitle || 'a new task'}`
          : `New task created: ${data.taskTitle || 'a task'}`,
      };

    case 'TASK_ASSIGNED':
      return {
        title: 'Task Assigned',
        message: data.assignedByName
          ? `${data.assignedByName} assigned you to: ${data.taskTitle || 'a task'}`
          : `You've been assigned to: ${data.taskTitle || 'a task'}`,
      };

    case 'TASK_STATUS_CHANGED':
      const oldStatus = data.oldStatus
        ? String(data.oldStatus).replace(/_/g, ' ').toLowerCase()
        : 'previous';
      const newStatus = data.newStatus
        ? String(data.newStatus).replace(/_/g, ' ').toLowerCase()
        : 'new';
      return {
        title: 'Status Updated',
        message: data.changedByName
          ? `${data.changedByName} moved "${data.taskTitle || 'task'}" from ${oldStatus} to ${newStatus}`
          : `"${data.taskTitle || 'Task'}" moved from ${oldStatus} to ${newStatus}`,
      };

    case 'TASK_COMMENTED':
      return {
        title: 'New Comment',
        message: data.commentedBy
          ? `${data.commentedBy} commented on: ${data.taskTitle || 'a task'}`
          : `New comment on: ${data.taskTitle || 'your task'}`,
      };

    case 'MENTION':
      return {
        title: 'You Were Mentioned',
        message: data.mentionedBy
          ? `${data.mentionedBy} mentioned you in: ${data.taskTitle || 'a discussion'}`
          : `You were mentioned in: ${data.taskTitle || 'a task'}`,
      };

    case 'TASK_DUE_SOON':
      const daysUntil = data.daysUntilDue || 0;
      return {
        title: 'Task Due Soon',
        message: data.taskTitle
          ? `"${data.taskTitle}" is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
          : `Task due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      };

    case 'TASK_OVERDUE':
      const daysOver = data.daysOverdue || 0;
      return {
        title: 'Task Overdue',
        message: data.taskTitle
          ? `"${data.taskTitle}" is ${daysOver} day${daysOver !== 1 ? 's' : ''} overdue`
          : `Task is ${daysOver} day${daysOver !== 1 ? 's' : ''} overdue`,
      };

    case 'TASK_DELETED':
      return {
        title: 'Task Deleted',
        message: data.taskTitle
          ? `"${data.taskTitle}" has been removed`
          : 'A task has been deleted',
      };

    case 'SPRINT_STARTED':
      return {
        title: 'Sprint Started',
        message: data.sprintName ? `"${data.sprintName}" has begun` : 'A new sprint has started',
      };

    case 'SPRINT_COMPLETED':
      const completed = data.completedTasks || 0;
      const total = data.totalTasks || 0;
      return {
        title: 'Sprint Completed',
        message: data.sprintName
          ? `"${data.sprintName}" - ${completed}/${total} tasks completed`
          : 'Sprint has been completed',
      };

    case 'SPRINT_ENDING':
      const remaining = data.daysRemaining || 0;
      return {
        title: 'Sprint Ending Soon',
        message: data.sprintName
          ? `"${data.sprintName}" ends in ${remaining} day${remaining !== 1 ? 's' : ''}`
          : `Sprint ending in ${remaining} day${remaining !== 1 ? 's' : ''}`,
      };

    case 'PROJECT_INVITATION':
      return {
        title: 'Project Invitation',
        message: data.projectName
          ? `You've been invited to: ${data.projectName}`
          : 'You have a new project invitation',
      };

    case 'WORKSPACE_INVITATION':
      return {
        title: 'Workspace Invitation',
        message: data.workspaceName
          ? `You've been invited to: ${data.workspaceName}`
          : 'You have a new workspace invitation',
      };
    case 'CHAT_ADDED_TO_CHANNEL':
      return {
        title: data.isDirect ? 'New Conversation' : 'Added to Channel',
        message: data.isDirect
          ? `${data.addedBy || 'Someone'} started a conversation with you`
          : `${data.addedBy || 'Someone'} added you to #${data.channelName || 'a channel'}`,
      };

    case 'CHAT_REMOVED_FROM_CHANNEL':
      return {
        title: 'Removed from Channel',
        message: `${data.removedBy || 'Someone'} removed you from #${data.channelName || 'a channel'}`,
      };

    case 'CHAT_MENTION':
      return {
        title: data.isDirect ? 'Mentioned in DM' : `Mentioned in #${data.channelName || 'chat'}`,
        message: notification.message,
      };

    default:
      return {
        title: notification.title,
        message: notification.message,
      };
  }
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
export function useNotificationCount(p0: { enabled: boolean }) {
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
    onSuccess: () => {},
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
      const { title, message } = formatNotificationMessage(notification);
      showNotification(title, {
        body: message,
        tag: notification.id,
      });
    }
  };

  return {
    enabled,
    handleNewNotification,
  };
}
