// ✅ FINAL VERSION: src/lib/NotificationToast.tsx
import React from 'react';
import { X } from 'lucide-react';
import toast, { Toast } from 'react-hot-toast';
import {
  formatNotificationMessage,
  getNotificationLink,
  Notification,
  NOTIFICATION_CONFIG,
  useMarkNotificationRead,
  NotificationType,
} from '../hooks/api/useNotifications';

interface NotificationToastProps {
  t: Toast;
  notification: Notification;
  onSimpleNavigate?: (path: string) => void;
}

// ============================================
// SMART DEDUPLICATION SYSTEM
// ============================================

interface PendingNotification {
  notification: Notification;
  timestamp: number;
  dismissed: boolean;
}

// Store pending notifications with their task IDs
const pendingNotifications = new Map<string, PendingNotification>();
const DEDUP_WINDOW_MS = 1500; // 1.5 second deduplication window

/**
 * Notification priority ranking (lower = higher priority)
 */
const NOTIFICATION_PRIORITY: Record<NotificationType, number> = {
  TASK_ASSIGNED: 1,
  TASK_STATUS_CHANGED: 2,
  TASK_COMMENTED: 3,
  TASK_CREATED: 4,
  TASK_DELETED: 5,
  TASK_DUE_SOON: 6,
  TASK_OVERDUE: 7,
  TASK_UPDATED: 100, // Lowest priority - only show if nothing else
  SPRINT_STARTED: 8,
  SPRINT_COMPLETED: 9,
  SPRINT_ENDING: 10,
  MENTION: 11,
  PROJECT_INVITATION: 12,
  WORKSPACE_INVITATION: 13,
  CHAT_MESSAGE: 14,
};

/**
 * Clean up old pending notifications
 */
function cleanupPendingNotifications() {
  const now = Date.now();
  const toDelete: string[] = [];

  pendingNotifications.forEach((pending, key) => {
    if (now - pending.timestamp > DEDUP_WINDOW_MS) {
      toDelete.push(key);
    }
  });

  toDelete.forEach((key) => pendingNotifications.delete(key));
}

/**
 * Check if notification should be shown (intelligent deduplication)
 * Returns: { shouldShow: boolean, toastIdToDismiss?: string }
 */
function shouldShowNotification(notification: Notification): {
  shouldShow: boolean;
  toastIdToDismiss?: string;
} {
  cleanupPendingNotifications();

  const taskId = notification.data?.taskId as string | undefined;
  if (!taskId) {
    // No task ID - always show
    return { shouldShow: true };
  }

  // ✅ SMART FILTER: Suppress TASK_UPDATED if it's just a status/assignment change
  if (notification.type === 'TASK_UPDATED') {
    const changes = notification.data?.changes as string[] | undefined;

    if (changes && changes.length > 0) {
      // Check if ONLY status was changed
      if (
        changes.length === 1 &&
        (changes[0] === 'status' || changes[0].toLowerCase().includes('status'))
      ) {
        console.log(
          `⏭️ Suppressing TASK_UPDATED - status change will be shown as TASK_STATUS_CHANGED`
        );
        return { shouldShow: false };
      }

      // Check if ONLY assignee was changed
      if (
        changes.length === 1 &&
        (changes[0] === 'assignee' ||
          changes[0] === 'assigned' ||
          changes[0].toLowerCase().includes('assign'))
      ) {
        console.log(`⏭️ Suppressing TASK_UPDATED - assignment will be shown as TASK_ASSIGNED`);
        return { shouldShow: false };
      }

      // If changes include status OR assignee among other fields
      const hasStatusOrAssign = changes.some(
        (c) =>
          c === 'status' ||
          c === 'assignee' ||
          c === 'assigned' ||
          c.toLowerCase().includes('status') ||
          c.toLowerCase().includes('assign')
      );

      if (hasStatusOrAssign && changes.length <= 2) {
        // If 2 or fewer changes and one is status/assign, suppress
        console.log(`⏭️ Suppressing TASK_UPDATED - specific notification will cover it`);
        return { shouldShow: false };
      }
    }
  }

  const existing = pendingNotifications.get(taskId);
  const now = Date.now();

  if (!existing) {
    // First notification for this task - add to pending and show
    pendingNotifications.set(taskId, {
      notification,
      timestamp: now,
      dismissed: false,
    });
    return { shouldShow: true };
  }

  // Check if within deduplication window
  if (now - existing.timestamp > DEDUP_WINDOW_MS) {
    // Outside window - show new notification
    pendingNotifications.set(taskId, {
      notification,
      timestamp: now,
      dismissed: false,
    });
    return { shouldShow: true };
  }

  // Within deduplication window - compare priorities
  const existingPriority = NOTIFICATION_PRIORITY[existing.notification.type] ?? 999;
  const newPriority = NOTIFICATION_PRIORITY[notification.type] ?? 999;

  if (newPriority < existingPriority) {
    // New notification has higher priority - dismiss old, show new
    const toastIdToDismiss = `notification-${existing.notification.id}`;
    pendingNotifications.set(taskId, {
      notification,
      timestamp: now,
      dismissed: false,
    });
    return { shouldShow: true, toastIdToDismiss };
  } else if (newPriority === existingPriority) {
    // Same priority - keep existing, ignore new
    console.log(
      `⏭️ Skipping duplicate notification: ${notification.type} for task ${taskId} (same priority)`
    );
    return { shouldShow: false };
  } else {
    // Existing has higher priority - keep existing, ignore new
    console.log(
      `⏭️ Skipping lower priority notification: ${notification.type} for task ${taskId} (existing: ${existing.notification.type})`
    );
    return { shouldShow: false };
  }
}

// ============================================
// TOAST COMPONENT
// ============================================

export const NotificationToast: React.FC<NotificationToastProps> = ({
  t,
  notification,
  onSimpleNavigate,
}) => {
  const config = NOTIFICATION_CONFIG[notification.type] ?? NOTIFICATION_CONFIG.TASK_UPDATED;
  const Icon = config.icon;
  const { title, message } = formatNotificationMessage(notification);

  const markAsRead = useMarkNotificationRead();

  const handleNavigate = async () => {
    toast.dismiss(t.id);

    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    // Navigation is handled by the onSimpleNavigate callback
    const link = getNotificationLink(notification);
    if (link && onSimpleNavigate) {
      onSimpleNavigate(link);
    }
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
      style={
        {
          '--tw-ring-color': config.hexColor,
        } as React.CSSProperties
      }
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon with gradient background */}
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

          {/* Content */}
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
              {title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {message}
            </p>

            {/* Time indicator */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Just now</p>
          </div>

          {/* Close button */}
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

      {/* Progress bar with gradient */}
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

/**
 * Show toast for notification with smart deduplication
 */
export function showNotificationToast(
  notification: Notification,
  navigateHandler: (notification: Notification) => void | Promise<void>
) {
  const { shouldShow, toastIdToDismiss } = shouldShowNotification(notification);

  if (!shouldShow) {
    console.log(`⏭️ Not showing duplicate notification: ${notification.type}`);
    return;
  }

  // Dismiss old toast if needed (for priority replacement)
  if (toastIdToDismiss) {
    toast.dismiss(toastIdToDismiss);
    console.log(`🔄 Replacing lower priority notification with: ${notification.type}`);
  }

  toast.custom(
    (t) => (
      <div className="flex justify-center px-4 pointer-events-none">
        <NotificationToast
          t={t}
          notification={notification}
          onSimpleNavigate={() => navigateHandler(notification)}
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

/**
 * Show toast for WebSocket notification with smart deduplication
 */
export function showWebSocketNotificationToast(
  type: NotificationType,
  data: Record<string, unknown>,
  navigateHandler: (notification: Notification) => void | Promise<void>
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

  showNotificationToast(notification, navigateHandler);
}
