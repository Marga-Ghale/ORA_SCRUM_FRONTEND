// ✅ FIXED: src/components/notifications/NotificationToast.tsx

import { X } from 'lucide-react';
import toast, { Toast } from 'react-hot-toast';
import {
  formatNotificationMessage,
  getNotificationLink,
  Notification,
  NOTIFICATION_CONFIG,
  NotificationType,
  useMarkNotificationRead,
} from '../hooks/api/useNotifications';

// ============================================
// Toast Notification Component
// ============================================

interface NotificationToastProps {
  t: Toast;
  notification: Notification;
  onNavigate?: (link: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  t,
  notification,
  onNavigate,
}) => {
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.TASK_UPDATED;
  const Icon = config.icon;
  const { title, message } = formatNotificationMessage(notification);
  const link = getNotificationLink(notification);

  const markAsRead = useMarkNotificationRead();

  const handleNavigate = () => {
    console.log('🎯 Toast clicked, link:', link); // Debug
    toast.dismiss(t.id);

    // Mark as read if notification is UNREAD
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    // ✅ Navigate if link exists and callback is provided
    if (link && onNavigate) {
      console.log('✅ Navigating to:', link);
      onNavigate(link);
    } else {
      console.warn('❌ No navigation:', { link, hasCallback: !!onNavigate });
    }
  };

  return (
    <div
      onClick={handleNavigate}
      role="button"
      aria-label="Open notification"
      className={`
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-sm w-full
        bg-white dark:bg-gray-800
        shadow-lg rounded-xl
        pointer-events-auto
        ring-1 ring-black/5 dark:ring-white/10
        overflow-hidden
        cursor-pointer
        transition-all
        hover:bg-gray-50 dark:hover:bg-gray-700/60
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className="
              flex-shrink-0 p-1 rounded-md
              text-gray-400 hover:text-gray-600
              hover:bg-gray-100
              dark:hover:text-gray-200
              dark:hover:bg-gray-700
              transition-colors
            "
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: config.hexColor,
            animation: t.visible ? 'shrink 5s linear forwards' : 'none',
          }}
        />
      </div>
    </div>
  );
};

// ============================================
// Show Notification Toast (TOP-CENTER)
// ============================================

export function showNotificationToast(
  notification: Notification,
  navigate?: (path: string) => void
) {
  console.log('📨 Showing toast for notification:', notification);

  toast.custom(
    (t) => (
      <div className="mt-16 flex justify-center px-4">
        <NotificationToast t={t} notification={notification} onNavigate={navigate} />
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center',
      id: `notification-${notification.id}`,
    }
  );
}

// ============================================
// WebSocket → Toast Bridge (ENHANCED)
// ============================================

export function showWebSocketNotificationToast(
  type: NotificationType,
  data: Record<string, unknown>,
  navigate?: (path: string) => void
) {
  console.log('🔌 WebSocket notification received:', { type, data });

  // ✅ CRITICAL: Extract ALL possible navigation data from WebSocket payload
  const notification: Notification = {
    id: (data.id as string) || `ws-${Date.now()}`,
    userId: (data.userId as string) || '',
    type,
    title: (data.title as string) || 'New Notification',
    message: (data.message as string) || '',
    read: false,
    data: {
      // ✅ Task-related data
      taskId: data.taskId as string,
      taskKey: data.taskKey as string,

      // ✅ Project-related data
      projectId: data.projectId as string,
      projectKey: data.projectKey as string,

      // ✅ Workspace-related data
      workspaceId: data.workspaceId as string,
      workspaceKey: data.workspaceKey as string,

      // ✅ Sprint-related data
      sprintId: data.sprintId as string,
      sprintName: data.sprintName as string,

      // ✅ Comment-related data
      commentId: data.commentId as string,

      // ✅ User-related data
      assignedBy: data.assignedBy as string,
      assignedTo: data.assignedTo as string,
      assignedByName: data.assignedByName as string,
      assignedToName: data.assignedToName as string,

      // ✅ Status/Priority data
      status: data.status as string,
      oldStatus: data.oldStatus as string,
      newStatus: data.newStatus as string,
      priority: data.priority as string,

      // ✅ Due date data
      dueDate: data.dueDate as string,

      // ✅ Invitation data
      invitationId: data.invitationId as string,
      invitationType: data.invitationType as string,

      // ✅ Keep ALL original data for safety
      ...data,
    } as any,
    createdAt: new Date().toISOString(),
  };

  console.log('📋 Created notification object:', notification);
  console.log('🔗 Navigation data:', {
    projectId: notification.data?.projectId,
    taskId: notification.data?.taskId,
    workspaceId: notification.data?.workspaceId,
  });

  showNotificationToast(notification, navigate);
}
