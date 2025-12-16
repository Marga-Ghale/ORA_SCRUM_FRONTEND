// src/components/header/NotificationDropdown.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Dropdown } from '../ui/dropdown/Dropdown';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteAllNotifications,
  useDeleteNotification,
  useNotificationSound,
  useBrowserNotifications,
  getNotificationConfig,
  getNotificationLink,
  groupNotificationsByDate,
  Notification,
  NotificationType,
} from '../../hooks/api/useNotifications';
import { useWebSocket } from '../../hooks/api/useWebsocket';

// ============================================
// Notification Item Component
// ============================================

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
  onClick,
}) => {
  const config = getNotificationConfig(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`relative flex gap-3 rounded-lg p-3 transition-colors cursor-pointer group ${
        !notification.read
          ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          : 'hover:bg-gray-100 dark:hover:bg-white/5'
      }`}
      onClick={() => onClick(notification)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
      )}

      {/* Icon */}
      <span
        className={`flex items-center justify-center w-10 h-10 rounded-full ${config.bgColor} text-lg flex-shrink-0`}
      >
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-white/90 line-clamp-1">
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>{timeAgo}</span>
          {notification.data?.taskKey && (
            <>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span className="font-mono text-brand-500">{notification.data.taskKey}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={`flex items-start gap-1 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Mark as read"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================
// Notification Group Component
// ============================================

interface NotificationGroupProps {
  title: string;
  notifications: Notification[];
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const NotificationGroup: React.FC<NotificationGroupProps> = ({
  title,
  notifications,
  onRead,
  onDelete,
  onClick,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="mb-4">
      <h6 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h6>
      <div className="space-y-1">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={onRead}
            onDelete={onDelete}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// Empty State Component
// ============================================

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    </div>
    <p className="text-gray-600 dark:text-gray-300 font-medium">No notifications</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">
      When you get notifications, they'll show up here
    </p>
  </div>
);

// ============================================
// Loading Skeleton Component
// ============================================

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3 p-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-3 p-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2" />
        </div>
      </div>
    ))}
  </div>
);

// ============================================
// Filter Tabs Component
// ============================================

type FilterType = 'all' | 'unread' | 'tasks' | 'sprints' | 'invitations';

interface FilterTabsProps {
  activeFilter: FilterType;
  onChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
}

const TASK_NOTIFICATION_TYPES: NotificationType[] = [
  'TASK_ASSIGNED',
  'TASK_UPDATED',
  'TASK_COMMENTED',
  'TASK_STATUS_CHANGED',
  'TASK_DUE_SOON',
  'TASK_OVERDUE',
  'TASK_CREATED',
  'TASK_DELETED',
];

const SPRINT_NOTIFICATION_TYPES: NotificationType[] = [
  'SPRINT_STARTED',
  'SPRINT_COMPLETED',
  'SPRINT_ENDING',
];

const INVITATION_NOTIFICATION_TYPES: NotificationType[] = [
  'PROJECT_INVITATION',
  'WORKSPACE_INVITATION',
];

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, onChange, counts }) => {
  const tabs: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'sprints', label: 'Sprints' },
    { id: 'invitations', label: 'Invites' },
  ];

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
      {tabs.map((tab) => {
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  activeFilter === tab.id
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const navigate = useNavigate();
  const previousUnreadCount = useRef<number>(0);

  // API hooks
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const { data: countData, refetch: refetchCount } = useNotificationCount();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const clearAll = useDeleteAllNotifications();
  const deleteNotification = useDeleteNotification();
  const { playSound } = useNotificationSound();
  const { showNotification: showBrowserNotification, hasPermission } = useBrowserNotifications();

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'notification') {
        // Refetch notifications when we receive a WebSocket notification
        refetch();
        refetchCount();

        // Play sound and show browser notification
        playSound();
        if (hasPermission()) {
          const data = message.data as { title?: string; message?: string };
          showBrowserNotification(data.title || 'New Notification', {
            body: data.message || 'You have a new notification',
          });
        }
      }
    },
  });

  const unreadCount = countData?.unread || 0;
  const hasUnread = unreadCount > 0;

  // Play sound for new notifications (polling fallback)
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
      playSound();
      if (hasPermission()) {
        showBrowserNotification('New Notification', {
          body: 'You have a new notification in ORA Scrum',
        });
      }
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount, playSound, showBrowserNotification, hasPermission]);

  // Filter notifications based on active filter
  const getFilteredNotifications = (): Notification[] => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'tasks':
        return notifications.filter((n) => TASK_NOTIFICATION_TYPES.includes(n.type));
      case 'sprints':
        return notifications.filter((n) => SPRINT_NOTIFICATION_TYPES.includes(n.type));
      case 'invitations':
        return notifications.filter((n) => INVITATION_NOTIFICATION_TYPES.includes(n.type));
      default:
        return notifications;
    }
  };

  // Calculate filter counts
  const filterCounts: Record<FilterType, number> = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    tasks: notifications.filter((n) => TASK_NOTIFICATION_TYPES.includes(n.type)).length,
    sprints: notifications.filter((n) => SPRINT_NOTIFICATION_TYPES.includes(n.type)).length,
    invitations: notifications.filter((n) => INVITATION_NOTIFICATION_TYPES.includes(n.type)).length,
  };

  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Handlers
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    const link = getNotificationLink(notification);
    navigate(link);
    closeDropdown();
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      await clearAll.mutateAsync();
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
      >
        {/* Unread badge */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* WebSocket connection indicator */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Real-time updates active' : 'Polling for updates'}
        />

        {/* Bell icon */}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[560px] w-[380px] flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-dark sm:w-[400px] lg:right-0"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Notifications
              </h5>
              {hasUnread && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllAsRead.isPending}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium disabled:opacity-50 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={toggleDropdown}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <FilterTabs
            activeFilter={activeFilter}
            onChange={setActiveFilter}
            counts={filterCounts}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="p-2">
              <NotificationGroup
                title="Today"
                notifications={groupedNotifications['Today'] || []}
                onRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
              <NotificationGroup
                title="Yesterday"
                notifications={groupedNotifications['Yesterday'] || []}
                onRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
              <NotificationGroup
                title="This Week"
                notifications={groupedNotifications['This Week'] || []}
                onRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
              <NotificationGroup
                title="Earlier"
                notifications={groupedNotifications['Earlier'] || []}
                onRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-2 p-3 border-t border-gray-100 dark:border-gray-700">
            <Link
              to="/notifications"
              onClick={closeDropdown}
              className="flex-1 px-4 py-2 text-sm font-medium text-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              View All
            </Link>
            <button
              onClick={handleClearAll}
              disabled={clearAll.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        )}
      </Dropdown>
    </div>
  );
}
