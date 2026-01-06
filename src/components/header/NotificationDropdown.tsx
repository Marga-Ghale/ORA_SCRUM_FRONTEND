// ✅ COMPLETE REPLACEMENT: src/components/header/NotificationDropdown.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  UserPlus,
  Trash2,
  Check,
  X,
  Zap,
  Play,
  PartyPopper,
  Hourglass,
  Mail,
  Building2,
  AtSign,
  Plus,
  Edit3,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
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
  getNotificationLink,
  groupNotificationsByDate,
  formatNotificationMessage,
  Notification,
  NotificationType,
} from '../../hooks/api/useNotifications';
import { useWebSocket } from '../../hooks/api/useWebsocket';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/api';
import { ConfirmModal } from '../modals/ConfirmModal';

// ============================================
// Modern Icon Mapping
// ============================================

const NOTIFICATION_ICONS: Record<NotificationType, { icon: any; color: string; bgColor: string }> =
  {
    TASK_CREATED: { icon: Plus, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    TASK_ASSIGNED: {
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    TASK_STATUS_CHANGED: {
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    TASK_UPDATED: {
      icon: Edit3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    TASK_COMMENTED: {
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    TASK_DUE_SOON: {
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    TASK_OVERDUE: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    TASK_DELETED: {
      icon: Trash2,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    },
    SPRINT_STARTED: {
      icon: Play,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    SPRINT_COMPLETED: {
      icon: PartyPopper,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    },
    SPRINT_ENDING: {
      icon: Hourglass,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    MENTION: { icon: AtSign, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
    PROJECT_INVITATION: {
      icon: Mail,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    },
    WORKSPACE_INVITATION: {
      icon: Building2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    },
    CHAT_MESSAGE: {
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
  };

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
  const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.TASK_UPDATED;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const [showActions, setShowActions] = useState(false);
  const { title, message } = formatNotificationMessage(notification);

  return (
    <div
      className={`group relative flex gap-3 rounded-lg p-3 transition-all duration-200 cursor-pointer border ${
        !notification.read
          ? 'bg-blue-50/50 dark:bg-blue-900/5 border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/10'
          : 'bg-white dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      onClick={() => onClick(notification)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-blue-500" />
      )}

      {/* Icon */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} flex-shrink-0`}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{message}</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
          {notification.data?.taskKey && (
            <>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              {/* <span className="font-mono text-brand-600 dark:text-brand-400 font-medium">
                {notification.data.taskKey}
              </span> */}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={`flex items-start gap-1 transition-opacity duration-200 ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
            className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          title="Delete"
        >
          <X className="w-4 h-4" />
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
      <div className="flex items-center gap-2 px-1 mb-2">
        <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </h6>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {notifications.length}
        </span>
      </div>
      <div className="space-y-2">
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
    <div className="relative mb-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
        <Check className="w-3 h-3 text-white" />
      </div>
    </div>
    <p className="text-gray-900 dark:text-gray-100 font-semibold text-base mb-1">All caught up!</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
      No new notifications at the moment
    </p>
  </div>
);

// ============================================
// Loading Skeleton Component
// ============================================

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3 p-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex gap-3 p-3 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
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
  const tabs: { id: FilterType; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'unread', label: 'Unread', icon: AlertCircle },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'sprints', label: 'Sprints', icon: Zap },
    { id: 'invitations', label: 'Invites', icon: Mail },
  ];

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-x-auto">
      {tabs.map((tab) => {
        const count = counts[tab.id];
        const isActive = activeFilter === tab.id;
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <TabIcon className="w-3.5 h-3.5" />
            {tab.label}
            {count > 0 && (
              <span
                className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                  isActive
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
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

  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const { data: countData, refetch: refetchCount } = useNotificationCount();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const clearAll = useDeleteAllNotifications();
  const deleteNotification = useDeleteNotification();
  const { playSound } = useNotificationSound();
  const { showNotification: showBrowserNotification, hasPermission } = useBrowserNotifications();
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'notification') {
        refetch();
        refetchCount();
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

  const filterCounts: Record<FilterType, number> = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    tasks: notifications.filter((n) => TASK_NOTIFICATION_TYPES.includes(n.type)).length,
    sprints: notifications.filter((n) => SPRINT_NOTIFICATION_TYPES.includes(n.type)).length,
    invitations: notifications.filter((n) => INVITATION_NOTIFICATION_TYPES.includes(n.type)).length,
  };

  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

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
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleClearAll = async () => {
    setShowClearAllModal(true);
  };

  const confirmClearAll = async () => {
    try {
      await clearAll.mutateAsync();
      setShowClearAllModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
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
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection indicator */}
        <span
          className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-gray-900 ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Connected' : 'Reconnecting...'}
        />

        <Bell className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-2 flex h-[580px] w-[420px] flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h5>
              {hasUnread && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({unreadCount} new)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllAsRead.isPending}
                  className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium disabled:opacity-50 transition-colors px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={toggleDropdown}
                className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
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
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="p-3">
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
          <div className="flex-shrink-0 flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-800">
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

      <ConfirmModal
        isOpen={showClearAllModal}
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearAllModal(false)}
        title="Clear All Notifications"
        message="Are you sure you want to clear all notifications? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </div>
  );
}
