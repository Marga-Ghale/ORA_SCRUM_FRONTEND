/* eslint-disable react-refresh/only-export-components */
// src/lib/NotificationToast.tsx - SMART DEDUPLICATION FIX
import React from 'react';
import { X } from 'lucide-react';
import toast, { Toast } from 'react-hot-toast';
import {
  formatNotificationMessage,
  NOTIFICATION_CONFIG,
  useMarkNotificationRead,
  NotificationType,
  Notification,
} from '../hooks/api/useNotifications';
import { useNotificationNavigation } from '../hooks/api/useNotificationNavigation';
import { isViewingChannel } from './activeChannelTracker';

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
const DEDUP_WINDOW_MS = 2000; // 2 seconds

const NOTIFICATION_PRIORITY: Record<NotificationType, number> = {
  TASK_ASSIGNED: 1,
  TASK_STATUS_CHANGED: 2,
  TASK_COMMENTED: 3,
  TASK_CREATED: 4,
  TASK_DELETED: 5,
  TASK_DUE_SOON: 6,
  TASK_OVERDUE: 7,
  TASK_UPDATED: 100, // Lowest priority - easily replaced
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

/**
 * ✅ ENHANCED: Smart filtering to prevent redundant notifications
 */
function shouldShowNotification(notification: Notification): {
  shouldShow: boolean;
  toastIdToDismiss?: string;
} {
  cleanupPendingNotifications();

  const taskId = notification.data?.taskId as string | undefined;
  if (!taskId) return { shouldShow: true };

  // ============================================
  // RULE 1: IGNORE REDUNDANT TASK_UPDATED
  // ============================================
  if (notification.type === 'TASK_UPDATED') {
    const changes = notification.data?.changes as string[] | undefined;

    // ✅ Ignore if ONLY status changed (TASK_STATUS_CHANGED handles this)
    if (changes?.length === 1 && changes[0].toLowerCase().includes('status')) {
      console.log('⏭️ Ignoring TASK_UPDATED - status only (covered by TASK_STATUS_CHANGED)');
      return { shouldShow: false };
    }

    // ✅ Ignore if ONLY assignees changed (TASK_ASSIGNED handles this)
    if (changes?.length === 1 && changes[0].toLowerCase().includes('assign')) {
      console.log('⏭️ Ignoring TASK_UPDATED - assignees only (covered by TASK_ASSIGNED)');
      return { shouldShow: false };
    }

    // ✅ Ignore if ONLY status + assignees changed (both have specific notifications)
    const hasOnlyStatusOrAssign = changes?.every(
      (c) => c.toLowerCase().includes('status') || c.toLowerCase().includes('assign')
    );
    if (hasOnlyStatusOrAssign && (changes?.length ?? 0) <= 2) {
      console.log(
        '⏭️ Ignoring TASK_UPDATED - only status/assign changes (covered by specific notifications)'
      );
      return { shouldShow: false };
    }
  }

  // ============================================
  // RULE 2: DEDUPLICATION WITHIN TIME WINDOW
  // ============================================
  const existing = pendingNotifications.get(taskId);
  const now = Date.now();

  if (!existing) {
    pendingNotifications.set(taskId, { notification, timestamp: now, dismissed: false });
    return { shouldShow: true };
  }

  // If enough time has passed, allow new notification
  if (now - existing.timestamp > DEDUP_WINDOW_MS) {
    pendingNotifications.set(taskId, { notification, timestamp: now, dismissed: false });
    return { shouldShow: true };
  }

  // ============================================
  // RULE 3: PRIORITY-BASED REPLACEMENT
  // ============================================
  const existingPriority = NOTIFICATION_PRIORITY[existing.notification.type] ?? 999;
  const newPriority = NOTIFICATION_PRIORITY[notification.type] ?? 999;

  // Replace with higher priority notification
  if (newPriority < existingPriority) {
    const toastIdToDismiss = `notification-${existing.notification.id}`;
    pendingNotifications.set(taskId, { notification, timestamp: now, dismissed: false });
    console.log(
      `🔄 Replacing ${existing.notification.type} with ${notification.type} (higher priority)`
    );
    return { shouldShow: true, toastIdToDismiss };
  }

  // Same priority or lower - skip
  console.log(
    `⏭️ Skipping ${notification.type} - duplicate or lower priority than ${existing.notification.type}`
  );
  return { shouldShow: false };
}

// ============================================
// HELPER: EXTRACT TASK DATA FROM NOTIFICATION
// ============================================
function extractTaskData(notification: Notification): { taskId?: string; projectId?: string } {
  const data = notification.data || {};

  // Try direct fields first
  let taskId = data.taskId as string | undefined;
  let projectId = data.projectId as string | undefined;

  // Try nested data
  if (!taskId && data.data) {
    const nestedData = data.data as Record<string, unknown>;
    taskId = nestedData.taskId as string | undefined;
    projectId = nestedData.projectId as string | undefined;
  }

  // Try payload
  if (!taskId && data.payload) {
    const payloadData = data.payload as Record<string, unknown>;
    taskId = payloadData.taskId as string | undefined;
    projectId = payloadData.projectId as string | undefined;
  }

  return { taskId, projectId };
}

// ============================================
// TOAST COMPONENT
// ============================================

export const NotificationToast: React.FC<NotificationToastProps> = ({ t, notification }) => {
  const config = NOTIFICATION_CONFIG[notification.type] ?? NOTIFICATION_CONFIG.TASK_UPDATED;
  const Icon = config.icon;
  // ✅ Use backend's already-formatted message for toasts
  const title = notification.title;
  const message = notification.message;
  const markAsRead = useMarkNotificationRead();
  const { navigateToTask } = useNotificationNavigation();

  const handleNavigate = async () => {
    try {
      if (!notification.read) {
        await markAsRead.mutateAsync(notification.id);
      }

      const { taskId, projectId } = extractTaskData(notification);

      if (taskId) {
        await navigateToTask(taskId, projectId);
      }

      toast.dismiss(t.id);
    } catch (error) {
      console.error('[NotificationToast] Navigation failed:', error);
      toast.error('Failed to navigate to task');
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

  if (!shouldShow) {
    console.log('⏭️ Skipping notification:', {
      id: notification.id,
      type: notification.type,
      changes: notification.data?.changes,
    });
    return;
  }

  if (toastIdToDismiss) {
    console.log('🔄 Dismissing previous notification:', toastIdToDismiss);
    toast.dismiss(toastIdToDismiss);
  }

  console.log('✅ Showing notification:', {
    id: notification.id,
    type: notification.type,
    changes: notification.data?.changes,
  });

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
  // ✅ SMART: Skip CHAT_MESSAGE toast if user is viewing that channel
  if (type === 'CHAT_MESSAGE') {
    const channelId = (data.channelId || (data.data as any)?.channelId) as string | undefined;
    if (channelId && isViewingChannel(channelId)) {
      console.log('⏭️ Skipping CHAT_MESSAGE toast - user is viewing channel:', channelId);
      return;
    }
  }
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
