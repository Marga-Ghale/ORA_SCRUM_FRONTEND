// src/components/activity/ActivityFeed.tsx
import React, { useMemo } from 'react';
import {
  useNotifications,
  formatNotificationTime,
  getNotificationConfig,
} from '../../hooks/api/useNotifications';
import { Activity, CheckCircle2, Clock } from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const { data: notifications, isLoading } = useNotifications(false);

  const recentActivity = useMemo(() => {
    return notifications?.slice(0, 10) || [];
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!recentActivity.length) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentActivity.map((notification) => {
        const config = getNotificationConfig(notification.type);
        return (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              notification.read
                ? 'bg-gray-50 dark:bg-gray-800/30'
                : 'bg-blue-50 dark:bg-blue-900/20'
            } hover:bg-gray-100 dark:hover:bg-gray-700/50`}
          >
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: config.hexBgColor }}
            >
              <span className="text-lg">{config.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                {notification.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatNotificationTime(notification.createdAt)}</span>
              </div>
            </div>

            {/* Status */}
            {notification.read ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
            )}
          </div>
        );
      })}
    </div>
  );
};
