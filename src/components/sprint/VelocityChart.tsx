// src/components/sprints/VelocityChart.tsx
import React from 'react';
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { useVelocityTrend } from '../../hooks/api/useSprints';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface VelocityChartProps {
  projectId: string;
  className?: string;
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ projectId, className = '' }) => {
  const { data: velocityData, isLoading, error } = useVelocityTrend(projectId);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-6 ${className}`}
      >
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load velocity data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!velocityData || velocityData.sprints.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No velocity data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Complete some sprints to see velocity trends
          </p>
        </div>
      </div>
    );
  }

  // Format data for charts
  const chartData = velocityData.sprints.map((sprint) => ({
    name: sprint.sprintName,
    number: sprint.sprintNumber,
    committed: sprint.committedPoints,
    completed: sprint.completedPoints,
    average: Math.round(velocityData.averageVelocity),
  }));

  // Determine trend icon and color
  const getTrendIcon = () => {
    switch (velocityData.trendDirection) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (velocityData.trendDirection) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} points
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Velocity Trend
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Team velocity over the last {velocityData.sprints.length} sprints
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Average Velocity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(velocityData.averageVelocity)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Trend</p>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon()}
                <span className={`text-xl font-bold ${getTrendColor()}`}>
                  {Math.abs(velocityData.trendPercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="name"
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              label={{
                value: 'Story Points',
                angle: -90,
                position: 'insideLeft',
                className: 'text-gray-600 dark:text-gray-400',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />

            {/* Bars for committed and completed */}
            <Bar dataKey="committed" fill="#3b82f6" name="Committed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />

            {/* Line for average */}
            <Line
              type="monotone"
              dataKey="average"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Average"
              dot={{ fill: '#f59e0b', r: 4 }}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sprint Details Table */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Sprint Details
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                  Sprint
                </th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                  Committed
                </th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                  Completed
                </th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                  Completion %
                </th>
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                  Period
                </th>
              </tr>
            </thead>
            <tbody>
              {velocityData.sprints.map((sprint) => {
                const completionRate =
                  sprint.committedPoints > 0
                    ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100)
                    : 0;

                return (
                  <tr
                    key={sprint.sprintId}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-2 px-3 text-gray-900 dark:text-gray-100 font-medium">
                      {sprint.sprintName}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100">
                      {sprint.committedPoints}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100">
                      {sprint.completedPoints}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          completionRate >= 100
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : completionRate >= 80
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : completionRate >= 60
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {completionRate}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(sprint.startDate).toLocaleDateString()} -{' '}
                      {new Date(sprint.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
