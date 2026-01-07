// src/lib/NotificationToast.tsx (or wherever it is)

import React from 'react';
import { X } from 'lucide-react';
import toast, { Toast } from 'react-hot-toast';
import {
  formatNotificationMessage,
  getNotificationLink,
  Notification,
  NOTIFICATION_CONFIG,
  useMarkNotificationRead,
} from '../hooks/api/useNotifications';

interface NotificationToastProps {
  t: Toast;
  notification: Notification;
  onNavigate?: (taskId: string, projectId?: string) => Promise<void>;
  onSimpleNavigate?: (path: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  t,
  notification,
  onNavigate,
  onSimpleNavigate,
}) => {
  const config = NOTIFICATION_CONFIG[notification.type] ?? NOTIFICATION_CONFIG.TASK_UPDATED;
  const Icon = config.icon;
  const { title, message } = formatNotificationMessage(notification);
  const markAsRead = useMarkNotificationRead();

  const handleNavigate = async () => {
    toast.dismiss(t.id);

    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    const taskId = notification.data?.taskId as string | undefined;
    const projectId = notification.data?.projectId as string | undefined;

    if (taskId && onNavigate) {
      await onNavigate(taskId, projectId);
    } else {
      const link = getNotificationLink(notification);
      if (link && onSimpleNavigate) {
        onSimpleNavigate(link);
      }
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
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {message}
            </p>
          </div>

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

// Updated function to show toast with context
export function showNotificationToast(
  notification: Notification,
  onNavigate: (taskId: string, projectId?: string) => Promise<void>,
  onSimpleNavigate: (path: string) => void
) {
  toast.custom(
    (t) => (
      <div className="mt-16 flex justify-center px-4">
        <NotificationToast
          t={t}
          notification={notification}
          onNavigate={onNavigate}
          onSimpleNavigate={onSimpleNavigate}
        />
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center',
      id: `notification-${notification.id}`,
    }
  );
}

// Updated WebSocket toast function
export function showWebSocketNotificationToast(
  type: any,
  data: Record<string, unknown>,
  onNavigate: (taskId: string, projectId?: string) => Promise<void>,
  onSimpleNavigate: (path: string) => void
) {
  const notification: Notification = {
    id: (data.id as string) ?? `ws-${Date.now()}`,
    userId: (data.userId as string) ?? '',
    type,
    title: (data.title as string) ?? 'New Notification',
    message: (data.message as string) ?? '',
    read: false,
    data: {
      ...data,
    },
    createdAt: new Date().toISOString(),
  };

  showNotificationToast(notification, onNavigate, onSimpleNavigate);
}
