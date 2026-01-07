/* eslint-disable react-hooks/exhaustive-deps */
// ✅ NEW FILE: src/components/NotificationHandler.tsx
// This component handles WebSocket notifications and provides navigation context

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/api/useWebsocket';
import { useNotificationNavigation } from '../hooks/api/useNotificationNavigation';
import { Notification } from '../hooks/api/useNotifications';

/**
 * Component that handles WebSocket notifications and navigation
 * Must be placed inside Router context
 */
export const NotificationHandler: React.FC = () => {
  const navigate = useNavigate();
  const { navigateToTask } = useNotificationNavigation();

  /**
   * Navigation handler for toast notifications
   * This function has access to Router context
   */
  const handleNotificationNavigation = async (notification: Notification) => {
    const taskId = notification.data?.taskId as string | undefined;
    const projectId = notification.data?.projectId as string | undefined;

    if (taskId) {
      // Task navigation with full hierarchy
      await navigateToTask(taskId, projectId);
    } else {
      // Simple navigation
      const link = getNotificationLink(notification);
      if (link) {
        navigate(link);
      }
    }
  };

  // Store the navigation handler globally so toasts can access it
  useEffect(() => {
    // @ts-ignore - Adding to window for toast access
    window.__notificationNavigate = handleNotificationNavigation;

    return () => {
      // @ts-ignore
      delete window.__notificationNavigate;
    };
  }, [handleNotificationNavigation]);

  // Initialize WebSocket connection
  useWebSocket({
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  });

  return null; // This component doesn't render anything
};

/**
 * Helper function to get notification link
 */
function getNotificationLink(notification: Notification): string {
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
