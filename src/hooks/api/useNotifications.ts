import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// Types
export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_commented'
  | 'sprint_started'
  | 'sprint_completed'
  | 'mention'
  | 'due_date_reminder'
  | 'project_invitation'
  | 'workspace_invitation';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: {
    taskId?: string;
    projectId?: string;
    sprintId?: string;
    commentId?: string;
    workspaceId?: string;
  };
  createdAt: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

// Get all notifications
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiClient.get<Notification[]>('/notifications'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get unread notifications
export function useUnreadNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: () => apiClient.get<Notification[]>('/notifications?unread=true'),
    refetchInterval: 15000, // Refetch every 15 seconds
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Clear all notifications
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.delete('/notifications'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
