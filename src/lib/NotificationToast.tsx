/* eslint-disable react-refresh/only-export-components */
import { X } from 'lucide-react';
import toast, { Toast } from 'react-hot-toast';
import {
  formatNotificationMessage,
  getNotificationLink,
  NOTIFICATION_CONFIG,
  NotificationType,
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
  const config = NOTIFICATION_CONFIG[notification.data] || NOTIFICATION_CONFIG.TASK_UPDATED;

  const Icon = config.icon;
  const { title, message } = formatNotificationMessage(notification.data);
  const link = getNotificationLink(notification.data);

  const handleNavigate = () => {
    toast.dismiss(t.id);
    if (onNavigate && link && link !== '/') {
      onNavigate(link);
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

          {/* Close button (no navigation) */}
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
// Show Notification Toast (POSITION FIXED)
// ============================================

export function showNotificationToast(
  notification: Notification,
  navigate?: (path: string) => void
) {
  toast.custom(
    (t) => (
      <div className="mt-16 flex justify-center px-4">
        <NotificationToast t={t} notification={notification} onNavigate={navigate} />
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center', // ✅ Middle-top sweet spot
      id: `notification-${notification.data}`,
    }
  );
}

// ============================================
// WebSocket → Toast Bridge
// ============================================

export function showWebSocketNotificationToast(
  type: NotificationType,
  data: Record<string, unknown>,
  navigate?: (path: string) => void
) {
  const notification: Notification = {
    id: (data.id as string) || `ws-${Date.now()}`,
    userId: (data.userId as string) || '',
    type,
    title: (data.title as string) || 'New Notification',
    message: (data.message as string) || '',
    read: false,
    data: data as any,
    createdAt: new Date().toISOString(),
  };

  showNotificationToast(notification, navigate);
}
