// ✅ FINAL INTEGRATION: src/lib/NotificationToast.tsx
import React from 'react';
import { X } from 'lucide-react';
import toast, { Toast } from 'react-hot-toast';
import {
  formatNotificationMessage,
  Notification,
  NOTIFICATION_CONFIG,
  useMarkNotificationRead,
  NotificationType,
} from '../hooks/api/useNotifications';
import { useNotificationNavigation } from '../hooks/api/useNotificationNavigation';

interface NotificationToastProps {
  t: Toast;
  notification: Notification;
}

// ============================================
// SMART DEDUPLICATION SYSTEM
// ============================================

interface PendingNotification {
  notification: Notification;
  timestamp: number;
  dismissed: boolean;
}

const pendingNotifications = new Map<string, PendingNotification>();
const DEDUP_WINDOW_MS = 1500; // 1.5 seconds

const NOTIFICATION_PRIORITY: Record<NotificationType, number> = {
  TASK_ASSIGNED: 1,
  TASK_STATUS_CHANGED: 2,
  TASK_COMMENTED: 3,
  TASK_CREATED: 4,
  TASK_DELETED: 5,
  TASK_DUE_SOON: 6,
  TASK_OVERDUE: 7,
  TASK_UPDATED: 100,
  SPRINT_STARTED: 8,
  SPRINT_COMPLETED: 9,
  SPRINT_ENDING: 10,
  MENTION: 11,
  PROJECT_INVITATION: 12,
  WORKSPACE_INVITATION: 13,
  CHAT_MESSAGE: 14,
};

function cleanupPendingNotifications() {
  const now = Date.now();
  const toDelete: string[] = [];
  pendingNotifications.forEach((pending, key) => {
    if (now - pending.timestamp > DEDUP_WINDOW_MS) toDelete.push(key);
  });
  toDelete.forEach((key) => pendingNotifications.delete(key));
}

function shouldShowNotification(notification: Notification): {
  shouldShow: boolean;
  toastIdToDismiss?: string;
} {
  cleanupPendingNotifications();

  const taskId = notification.data?.taskId as string | undefined;
  if (!taskId) return { shouldShow: true };

  if (notification.type === 'TASK_UPDATED') {
    const changes = notification.data?.changes as string[] | undefined;
    if (changes?.length === 1) {
      const field = changes[0].toLowerCase();
      if (field.includes('status') || field.includes('assign')) return { shouldShow: false };
    }
    const hasStatusOrAssign = changes?.some(
      (c) => c.toLowerCase().includes('status') || c.toLowerCase().includes('assign')
    );
    if (hasStatusOrAssign && (changes?.length ?? 0) <= 2) return { shouldShow: false };
  }

  const existing = pendingNotifications.get(taskId);
  const now = Date.now();

  if (!existing) {
    pendingNotifications.set(taskId, { notification, timestamp: now, dismissed: false });
    return { shouldShow: true };
  }

  if (now - existing.timestamp > DEDUP_WINDOW_MS) {
    pendingNotifications.set(taskId, { notification, timestamp: now, dismissed: false });
    return { shouldShow: true };
  }

  const existingPriority = NOTIFICATION_PRIORITY[existing.notification.type] ?? 999;
  const newPriority = NOTIFICATION_PRIORITY[notification.type] ?? 999;

  if (newPriority < existingPriority) {
    const toastIdToDismiss = `notification-${existing.notification.id}`;
    pendingNotifications.set(taskId, { notification, timestamp: now, dismissed: false });
    return { shouldShow: true, toastIdToDismiss };
  } else if (newPriority === existingPriority) {
    return { shouldShow: false };
  } else {
    return { shouldShow: false };
  }
}

// ============================================
// TOAST COMPONENT
// ============================================

export const NotificationToast: React.FC<NotificationToastProps> = ({ t, notification }) => {
  const config = NOTIFICATION_CONFIG[notification.type] ?? NOTIFICATION_CONFIG.TASK_UPDATED;
  const Icon = config.icon;
  const { title, message } = formatNotificationMessage(notification);
  const markAsRead = useMarkNotificationRead();
  const { navigateToTask } = useNotificationNavigation();

  const handleNavigate = async () => {
    console.log('[NotificationToast] handleNavigate called', { notification });

    if (!notification.read) {
      console.log('[NotificationToast] Marking as read', notification.id);
      await markAsRead.mutateAsync(notification.id);
    }

    // Correctly extract taskId and projectId
    const taskId = notification.data?.taskId ?? notification.data?.data?.taskId;
    const projectId = notification.data?.projectId ?? notification.data?.data?.projectId;

    if (taskId) {
      console.log('[NotificationToast] Navigating to task', { taskId, projectId });
      try {
        await navigateToTask(taskId, projectId);
        console.log('[NotificationToast] Navigation successful');
      } catch (err) {
        console.error('[NotificationToast] Navigation failed', err);
      }
    } else {
      console.log('[NotificationToast] No taskId found, skipping navigation');
    }

    toast.dismiss(t.id);
  };

  return (
    <div
      onClick={handleNavigate}
      role="button"
      aria-label="Open notification"
      className={`
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-md w-full
        bg-white dark:bg-gray-800
        shadow-xl rounded-2xl
        pointer-events-auto
        ring-1 ring-black/5 dark:ring-white/10
        overflow-hidden
        cursor-pointer
        transition-all duration-200
        hover:shadow-2xl
        hover:scale-[1.02]
        hover:ring-2
        hover:ring-offset-2
        dark:hover:ring-offset-gray-900
      `}
      style={{ '--tw-ring-color': config.hexColor } as React.CSSProperties}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`
              flex-shrink-0 w-11 h-11 rounded-xl
              flex items-center justify-center
              shadow-lg
              transform transition-transform duration-200
              group-hover:scale-110
            `}
            style={{
              background: `linear-gradient(135deg, ${config.hexColor}20, ${config.hexColor}40)`,
            }}
          >
            <Icon className={`w-5 h-5 ${config.color}`} strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
              {title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {message}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Just now</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className={`
              flex-shrink-0 p-1.5 rounded-lg
              text-gray-400 hover:text-gray-600
              hover:bg-gray-100
              dark:hover:text-gray-200
              dark:hover:bg-gray-700/50
              transition-colors duration-150
            `}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 dark:bg-gray-700/50">
        <div
          className="h-full rounded-full transition-all"
          style={{
            background: `linear-gradient(90deg, ${config.hexColor}, ${config.hexColor}cc)`,
            animation: t.visible ? 'shrink 5s linear forwards' : 'none',
          }}
        />
      </div>
    </div>
  );
};

// ============================================
// TOAST DISPLAY FUNCTIONS
// ============================================

export function showNotificationToast(notification: Notification) {
  const { shouldShow, toastIdToDismiss } = shouldShowNotification(notification);
  if (!shouldShow) return;

  if (toastIdToDismiss) toast.dismiss(toastIdToDismiss);

  toast.custom(
    (t) => (
      <div className="flex justify-center px-4 pointer-events-none">
        <NotificationToast t={t} notification={notification} />
      </div>
    ),
    { duration: 5000, position: 'top-center', id: `notification-${notification.id}` }
  );
}

export function showWebSocketNotificationToast(
  type: NotificationType,
  data: Record<string, unknown>
) {
  const notification: Notification = {
    id: (data.id as string) ?? `ws-${Date.now()}`,
    userId: (data.userId as string) ?? '',
    type,
    title: (data.title as string) ?? 'New Notification',
    message: (data.message as string) ?? '',
    read: false,
    data: { ...data },
    createdAt: new Date().toISOString(),
  };

  showNotificationToast(notification);
}
