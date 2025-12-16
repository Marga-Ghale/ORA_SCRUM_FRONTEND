// src/pages/inbox/InboxPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Inbox,
  Bell,
  AtSign,
  CheckSquare,
  MessageSquare,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  getNotificationConfig,
  Notification,
  useDeleteAllNotifications,
  groupNotificationsByDate,
} from '../../hooks/api/useNotifications';
import PageMeta from '../../components/common/PageMeta';

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
  { id: 'assigned', label: 'Assigned', icon: CheckSquare, types: ['TASK_ASSIGNED'] },
  { id: 'comments', label: 'Comments', icon: MessageSquare, types: ['TASK_COMMENTED'] },
];

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

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    // Navigate based on action
    const { data } = notification;
    if (data?.action === 'view_task' && data.taskId) {
      navigate(`/task/${data.taskId}`);
    } else if (data?.action === 'view_project' && data.projectId) {
      navigate(`/project/${data.projectId}/board`);
    } else if (data?.action === 'view_chat' && data.channelId) {
      navigate(`/chat/${data.channelId}`);
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

      <div className="h-full flex flex-col bg-[#0d0f11]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2e33]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Inbox</h1>
                <p className="text-sm text-[#6b7280]">{counts?.unread || 0} unread notifications</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {counts?.unread ? (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#9ca3af] hover:text-white hover:bg-[#25282c] rounded-lg transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              ) : null}
              <button
                onClick={() => deleteAll.mutate()}
                disabled={deleteAll.isPending || notifications.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#9ca3af] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-400'
                        : 'text-[#9ca3af] hover:bg-[#25282c] hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                  {count ? (
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        isActive ? 'bg-brand-500/30 text-brand-300' : 'bg-[#2a2e33] text-[#9ca3af]'
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 p-4 bg-[#1a1d21] rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#2a2e33]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#2a2e33] rounded w-1/3" />
                    <div className="h-3 bg-[#2a2e33] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1d21] flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-[#4b5563]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
              <p className="text-[#6b7280] text-sm max-w-sm">
                {activeFilter === 'all'
                  ? "You don't have any notifications yet"
                  : `No ${activeFilter} notifications`}
              </p>
            </div>
          ) : (
            <div className="p-4">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                <div key={group} className="mb-6">
                  <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider px-2 mb-2">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {items.map((notification) => {
                      const config = getNotificationConfig(notification.type);
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          onMouseEnter={() => setShowActions(notification.id)}
                          onMouseLeave={() => setShowActions(null)}
                          className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all group
                            ${
                              notification.read
                                ? 'bg-transparent hover:bg-[#1a1d21]'
                                : 'bg-[#1a1d21] hover:bg-[#25282c]'
                            }`}
                        >
                          {/* Unread indicator */}
                          {!notification.read && (
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500" />
                          )}

                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: config.bgColor }}
                          >
                            {config.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm font-medium ${
                                  notification.read ? 'text-[#9ca3af]' : 'text-white'
                                }`}
                              >
                                {notification.title}
                              </p>
                              <span className="text-xs text-[#6b7280] whitespace-nowrap flex-shrink-0">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <p
                              className={`text-sm mt-0.5 line-clamp-2 ${
                                notification.read ? 'text-[#6b7280]' : 'text-[#9ca3af]'
                              }`}
                            >
                              {notification.message}
                            </p>
                            {notification.data?.taskKey && (
                              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-[#25282c] rounded text-xs text-[#9ca3af]">
                                {notification.data.taskKey}
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          {showActions === notification.id && (
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markRead.mutate(notification.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-[#2a2e33] text-[#6b7280] hover:text-white transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification.mutate(notification.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6b7280] hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
    </>
  );
};

export default NotificationPage;
