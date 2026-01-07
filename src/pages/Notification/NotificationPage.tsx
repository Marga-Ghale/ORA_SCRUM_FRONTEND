// ✅ COMPLETE REPLACEMENT: src/pages/Notificaiton/NotificaitonPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Inbox,
  Bell,
  AtSign,
  UserCheck,
  MessageCircle,
  Check,
  CheckCheck,
  Trash2,
  ArrowUpRight,
  X,
  Sparkles,
  UserPlus,
  Edit3,
  RefreshCw,
  Clock,
  AlertCircle,
  Plus,
  Trash,
  Rocket,
  PartyPopper,
  Hourglass,
  Mail,
  Building2,
} from 'lucide-react';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  Notification,
  useDeleteAllNotifications,
  groupNotificationsByDate,
  getNotificationLink,
  formatNotificationMessage,
} from '../../hooks/api/useNotifications';
import PageMeta from '../../components/common/PageMeta';
import { useNotificationNavigation } from '../../hooks/api/useNotificationNavigation';

type FilterType = 'all' | 'unread' | 'mentions' | 'assigned' | 'comments';

const FILTER_OPTIONS: {
  id: FilterType;
  label: string;
  icon: React.ElementType;
  types?: string[];
}[] = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'unread', label: 'Unread', icon: Bell },
  { id: 'mentions', label: 'Mentions', icon: AtSign, types: ['MENTION'] },
  { id: 'assigned', label: 'Assigned', icon: UserCheck, types: ['TASK_ASSIGNED'] },
  { id: 'comments', label: 'Comments', icon: MessageCircle, types: ['TASK_COMMENTED'] },
];

// Professional icon mapping for notification types
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, { Icon: React.ElementType; color: string; bgColor: string }> = {
    TASK_ASSIGNED: {
      Icon: UserPlus,
      color: '#9333ea',
      bgColor: '#f3e8ff',
    },
    TASK_UPDATED: {
      Icon: Edit3,
      color: '#4f46e5',
      bgColor: '#eef2ff',
    },
    TASK_COMMENTED: {
      Icon: MessageCircle,
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
    TASK_STATUS_CHANGED: {
      Icon: RefreshCw,
      color: '#d97706',
      bgColor: '#fef3c7',
    },
    TASK_DUE_SOON: {
      Icon: Clock,
      color: '#ea580c',
      bgColor: '#fff7ed',
    },
    TASK_OVERDUE: {
      Icon: AlertCircle,
      color: '#dc2626',
      bgColor: '#fef2f2',
    },
    TASK_CREATED: {
      Icon: Plus,
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    TASK_DELETED: {
      Icon: Trash,
      color: '#6b7280',
      bgColor: '#f9fafb',
    },
    SPRINT_STARTED: {
      Icon: Rocket,
      color: '#059669',
      bgColor: '#f0fdf4',
    },
    SPRINT_COMPLETED: {
      Icon: PartyPopper,
      color: '#db2777',
      bgColor: '#fdf2f8',
    },
    SPRINT_ENDING: {
      Icon: Hourglass,
      color: '#ca8a04',
      bgColor: '#fefce8',
    },
    MENTION: {
      Icon: AtSign,
      color: '#0891b2',
      bgColor: '#ecfeff',
    },
    PROJECT_INVITATION: {
      Icon: Mail,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
    },
    WORKSPACE_INVITATION: {
      Icon: Building2,
      color: '#0d9488',
      bgColor: '#f0fdfa',
    },
    CHAT_MESSAGE: {
      Icon: MessageCircle,
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
  };

  return iconMap[type] || iconMap.TASK_UPDATED;
};

const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  const { data: notifications = [], isLoading } = useNotifications(activeFilter === 'unread');
  const { data: counts } = useNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();
  const { navigateToTask } = useNotificationNavigation();

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    const filterConfig = FILTER_OPTIONS.find((f) => f.id === activeFilter);
    if (!filterConfig?.types) return notifications;
    return notifications.filter((n) => filterConfig.types!.includes(n.type));
  }, [notifications, activeFilter]);

  // Group by date
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    const taskId = notification.data?.taskId as string | undefined;
    const projectId = notification.data?.projectId as string | undefined;

    if (taskId) {
      await navigateToTask(taskId, projectId);
    } else {
      navigate(getNotificationLink(notification));
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <PageMeta title="Inbox | ORA SCRUM" description="Your notifications" />

      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
        <div className="mx-auto h-screen flex flex-col">
          {/* Modern Header with Glassmorphism */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Inbox className="w-5 h-5 text-white" strokeWidth={2.5} />
                    {counts?.unread ? (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 border-2 border-white dark:border-[#111111] flex items-center justify-center">
                        <span className="text-[9px] sm:text-[10px] font-bold text-white leading-none">
                          {counts.unread > 9 ? '9+' : counts.unread}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                      Inbox
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                      {counts?.unread ? (
                        <>
                          <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500 text-white text-[10px] sm:text-xs font-semibold">
                            {counts.unread}
                          </span>
                          <span>unread notification{counts.unread !== 1 ? 's' : ''}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                          <span>All caught up</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {counts?.unread ? (
                    <button
                      onClick={() => markAllRead.mutate()}
                      disabled={markAllRead.isPending}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2
                        text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300
                        bg-white dark:bg-[#1a1a1a]
                        border border-gray-200 dark:border-white/10
                        rounded-xl hover:bg-gray-50 dark:hover:bg-[#222222]
                        transition-all duration-200 shadow-sm hover:shadow
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                      <span className="hidden sm:inline">Mark all read</span>
                      <span className="sm:hidden">Mark all</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => deleteAll.mutate()}
                    disabled={deleteAll.isPending || notifications.length === 0}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2
                      text-xs sm:text-sm font-medium text-red-600 dark:text-red-400
                      bg-white dark:bg-[#1a1a1a]
                      border border-gray-200 dark:border-white/10
                      rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10
                      transition-all duration-200 shadow-sm hover:shadow
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                    <span className="hidden sm:inline">Clear all</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                </div>
              </div>

              {/* Modern Filter Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {FILTER_OPTIONS.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  const count =
                    filter.id === 'unread'
                      ? counts?.unread
                      : filter.types
                        ? notifications.filter((n) => filter.types!.includes(n.type)).length
                        : notifications.length;

                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`group relative inline-flex items-center gap-2 px-3 sm:px-4 py-2
                        rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap
                        ${
                          isActive
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#222222]'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                      <span>{filter.label}</span>
                      {count && count > 0 ? (
                        <span
                          className={`inline-flex items-center justify-center min-w-[18px] h-4 sm:min-w-[20px] sm:h-5 px-1.5
                            text-[10px] sm:text-xs font-bold rounded-full transition-all
                            ${
                              isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 sm:p-4 bg-white dark:bg-[#111111] border border-gray-200/50 dark:border-white/5 rounded-2xl animate-pulse"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-200 dark:bg-[#222222] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 sm:h-3.5 bg-gray-200 dark:bg-[#222222] rounded-lg w-3/4" />
                      <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-[#222222] rounded-lg w-full" />
                      <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-[#222222] rounded-lg w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1a1a1a] dark:to-[#222222] flex items-center justify-center mb-4 sm:mb-6 shadow-inner">
                  <Inbox
                    className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-600"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm max-w-md leading-relaxed">
                  {activeFilter === 'all'
                    ? "You don't have any notifications yet. We'll let you know when something arrives."
                    : `No ${activeFilter} notifications at the moment.`}
                </p>
              </div>
            ) : (
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {Object.entries(groupedNotifications).map(([group, items]) => (
                  <div key={group} className="mb-6 sm:mb-8 last:mb-0">
                    <h3 className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-0.5 sm:px-1 mb-2 sm:mb-3">
                      {group}
                    </h3>

                    <div className="space-y-1.5 sm:space-y-2">
                      {items.map((notification) => {
                        const { Icon, color, bgColor } = getNotificationIcon(notification.type);
                        const { title, message } = formatNotificationMessage(notification);

                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            onMouseEnter={() => setShowActions(notification.id)}
                            onMouseLeave={() => setShowActions(null)}
                            className={`group relative flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer
                              transition-all duration-200 border
                              ${
                                notification.read
                                  ? 'bg-white dark:bg-[#111111] border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-md'
                                  : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10 border-indigo-100 dark:border-indigo-500/10 hover:shadow-md'
                              }`}
                          >
                            {/* Icon */}
                            <div
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-black/5 dark:border-white/5"
                              style={{
                                backgroundColor: notification.read
                                  ? 'rgba(156, 163, 175, 0.08)'
                                  : bgColor,
                              }}
                            >
                              <Icon
                                className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                                strokeWidth={2}
                                style={{ color: notification.read ? '#9ca3af' : color }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-0.5">
                                <p
                                  className={`text-xs sm:text-sm font-semibold leading-snug pr-1 ${
                                    notification.read
                                      ? 'text-gray-600 dark:text-gray-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {title}
                                </p>
                                <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>

                              <p
                                className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                                  notification.read
                                    ? 'text-gray-500 dark:text-gray-500'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {message}
                              </p>

                              {notification.data?.taskKey && (
                                <span
                                  className="inline-flex items-center gap-1 mt-2 px-2 py-1
                                    bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300
                                    rounded-lg text-[10px] sm:text-xs font-semibold border border-gray-200 dark:border-white/5
                                    hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                                >
                                  {notification.data.action}
                                  <ArrowUpRight
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                                    strokeWidth={2.5}
                                  />
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div
                              className={`flex items-center gap-0.5 sm:gap-1 transition-opacity duration-200 ${showActions === notification.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            >
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markRead.mutate(notification.id);
                                  }}
                                  className="p-1.5 rounded-lg sm:rounded-xl
                                    bg-white dark:bg-[#1a1a1a]
                                    border border-gray-200 dark:border-white/10
                                    text-gray-600 dark:text-gray-400
                                    hover:text-indigo-600 dark:hover:text-indigo-400
                                    hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                                    transition-all duration-200 shadow-sm"
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification.mutate(notification.id);
                                }}
                                className="p-1.5 rounded-lg sm:rounded-xl
                                  bg-white dark:bg-[#1a1a1a]
                                  border border-gray-200 dark:border-white/10
                                  text-gray-600 dark:text-gray-400
                                  hover:text-red-600 dark:hover:text-red-400
                                  hover:bg-red-50 dark:hover:bg-red-500/10
                                  transition-all duration-200 shadow-sm"
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPage;
