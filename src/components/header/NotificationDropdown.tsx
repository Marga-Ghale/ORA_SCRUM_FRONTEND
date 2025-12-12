// src/components/header/NotificationDropdown.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { 
  useNotifications, 
  useNotificationCount, 
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearAllNotifications,
  Notification 
} from "../../hooks/api/useNotifications";
import { formatDistanceToNow } from "date-fns";

// Notification type icons and colors
const NOTIFICATION_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  TASK_ASSIGNED: { 
    icon: '📋', 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30' 
  },
  TASK_UPDATED: { 
    icon: '✏️', 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' 
  },
  TASK_COMMENTED: { 
    icon: '💬', 
    color: 'text-green-500', 
    bgColor: 'bg-green-100 dark:bg-green-900/30' 
  },
  SPRINT_STARTED: { 
    icon: '🚀', 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30' 
  },
  SPRINT_COMPLETED: { 
    icon: '✅', 
    color: 'text-green-500', 
    bgColor: 'bg-green-100 dark:bg-green-900/30' 
  },
  MENTION: { 
    icon: '@', 
    color: 'text-brand-500', 
    bgColor: 'bg-brand-100 dark:bg-brand-900/30' 
  },
  DUE_DATE_REMINDER: { 
    icon: '⏰', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30' 
  },
  PROJECT_INVITATION: { 
    icon: '📁', 
    color: 'text-indigo-500', 
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' 
  },
  WORKSPACE_INVITATION: { 
    icon: '🏢', 
    color: 'text-teal-500', 
    bgColor: 'bg-teal-100 dark:bg-teal-900/30' 
  },
};

function getNotificationConfig(type: string) {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.TASK_ASSIGNED;
}

function getNotificationLink(notification: Notification): string {
  const data = notification.data;
  if (data?.taskId && data?.projectId) {
    return `/project/${data.projectId}/board?task=${data.taskId}`;
  }
  if (data?.projectId) {
    return `/project/${data.projectId}/board`;
  }
  if (data?.sprintId) {
    return `/sprints/${data.sprintId}`;
  }
  if (data?.workspaceId) {
    return `/workspace/${data.workspaceId}`;
  }
  return '/';
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // API hooks
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: countData } = useNotificationCount();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const clearAll = useClearAllNotifications();

  const unreadCount = countData?.unread || 0;
  const hasUnread = unreadCount > 0;

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    
    // Navigate to relevant page
    const link = getNotificationLink(notification);
    navigate(link);
    closeDropdown();
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
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {/* Notification badge */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
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

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
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
                className="text-xs text-brand-500 hover:text-brand-600 font-medium disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="p-3 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </li>
            ))
          ) : notifications.length === 0 ? (
            // Empty state
            <li className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                We'll notify you when something happens
              </p>
            </li>
          ) : (
            // Notification items
            notifications.map((notification) => {
              const config = getNotificationConfig(notification.type);
              const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

              return (
                <li key={notification.id}>
                  <DropdownItem
                    onItemClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    {/* Icon */}
                    <span className={`flex items-center justify-center w-10 h-10 rounded-full ${config.bgColor} text-lg flex-shrink-0`}>
                      {config.icon}
                    </span>

                    {/* Content */}
                    <span className="flex-1 min-w-0">
                      <span className="mb-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {notification.title}
                        </span>
                      </span>
                      <span className="block text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </span>
                      <span className="flex items-center gap-2 mt-1.5 text-gray-500 text-theme-xs dark:text-gray-400">
                        <span>{timeAgo}</span>
                        {!notification.read && (
                          <>
                            <span className="w-1 h-1 bg-blue-500 rounded-full" />
                            <span className="text-blue-500">New</span>
                          </>
                        )}
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
            <Link
              to="/notifications"
              onClick={closeDropdown}
              className="flex-1 px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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