// src/components/sprints/SprintViews.tsx
import React, { useState } from 'react';
import { BarChart3, Target, Calendar } from 'lucide-react';
import { VelocityChart } from './VelocityChart';
import { GoalsView } from './GoalsView';
import GanttChart from '../gantt/GanttChart';

interface SprintViewsProps {
  projectId: string;
  sprintId: string;
  className?: string;
}

type ViewMode = 'gantt' | 'velocity' | 'goals';

export const SprintViews: React.FC<SprintViewsProps> = ({
  projectId,
  sprintId,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');

  const viewOptions = [
    {
      id: 'gantt' as ViewMode,
      label: 'Gantt',
      icon: Calendar,
      description: 'Timeline view',
    },
    {
      id: 'velocity' as ViewMode,
      label: 'Velocity',
      icon: BarChart3,
      description: 'Team velocity trends',
    },
    {
      id: 'goals' as ViewMode,
      label: 'Goals',
      icon: Target,
      description: 'Sprint objectives',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* View Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            const isActive = viewMode === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{option.label}</span>
                <span className="sm:hidden">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Description */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {viewOptions.find((opt) => opt.id === viewMode)?.description}
          </p>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[400px]">
        {viewMode === 'gantt' && (
          <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Gantt view - Coming soon</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                <GanttChart projectId={projectId} sprintId={sprintId} />
              </p>
            </div>
          </div>
        )}

        {viewMode === 'velocity' && <VelocityChart projectId={projectId} />}

        {viewMode === 'goals' && <GoalsView sprintId={sprintId} />}
      </div>
    </div>
  );
};
