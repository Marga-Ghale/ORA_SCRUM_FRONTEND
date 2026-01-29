// src/components/gantt/GanttChart.tsx
import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  ChevronDown,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import { useProjectGantt } from '../../hooks/api/useGantt';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';

interface GanttChartProps {
  projectId: string;
  sprintId?: string;
}

const GanttChart: React.FC<GanttChartProps> = ({ projectId, sprintId }) => {
  const { data: ganttData, isLoading } = useProjectGantt(projectId, sprintId);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Calculate timeline grid
  const { startDate, endDate, dayColumns, totalDays } = useMemo(() => {
    if (!ganttData)
      return { startDate: new Date(), endDate: new Date(), dayColumns: [], totalDays: 0 };

    const start = new Date(ganttData.startDate);
    const end = new Date(ganttData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const columns: Date[] = [];
    for (let i = 0; i <= days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      columns.push(date);
    }

    return { startDate: start, endDate: end, dayColumns: columns, totalDays: days };
  }, [ganttData]);

  // Group tasks by parent
  const taskHierarchy = useMemo(() => {
    if (!ganttData) return [];

    const topLevel = ganttData.tasks.filter((t) => !t.parentTaskId);
    const childMap = new Map<string, typeof ganttData.tasks>();

    ganttData.tasks.forEach((task) => {
      if (task.parentTaskId) {
        if (!childMap.has(task.parentTaskId)) {
          childMap.set(task.parentTaskId, []);
        }
        childMap.get(task.parentTaskId)!.push(task);
      }
    });

    return topLevel.map((task) => ({
      task,
      children: childMap.get(task.id) || [],
    }));
  }, [ganttData]);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const calculateBarPosition = (task: (typeof ganttData.tasks)[0]) => {
    if (!task.startDate || !task.dueDate) return null;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);

    const startOffset = Math.max(
      0,
      (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.max(1, (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'in_review':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (date: Date, format: 'short' | 'long' = 'short') => {
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (!ganttData || ganttData.tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No timeline data
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Tasks need start and due dates to appear on the timeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Timeline</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(startDate, 'long')} - {formatDate(endDate, 'long')} ({totalDays} days)
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">Not Started</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {/* Task Names Column */}
              <div className="w-80 flex-shrink-0 px-6 py-3 border-r border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Task
                </p>
              </div>

              {/* Timeline Grid */}
              <div className="flex-1 flex">
                {dayColumns.map((date, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 min-w-[40px] px-2 py-3 border-r border-gray-200 dark:border-gray-700 ${
                      isWeekend(date) ? 'bg-gray-100 dark:bg-gray-900' : ''
                    } ${isToday(date) ? 'bg-brand-50 dark:bg-brand-950' : ''}`}
                  >
                    <p
                      className={`text-xs text-center font-medium ${
                        isToday(date)
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {formatDate(date)}
                    </p>
                    <p
                      className={`text-[10px] text-center ${
                        isToday(date)
                          ? 'text-brand-500 dark:text-brand-500'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <div>
            {taskHierarchy.map(({ task, children }) => (
              <React.Fragment key={task.id}>
                {/* Parent Task */}
                <TaskRow
                  task={task}
                  hasChildren={children.length > 0}
                  isExpanded={expandedTasks.has(task.id)}
                  onToggle={() => toggleExpand(task.id)}
                  position={calculateBarPosition(task)}
                  totalDays={totalDays}
                  isHovered={hoveredTask === task.id}
                  onHover={setHoveredTask}
                  getStatusIcon={getStatusIcon}
                />

                {/* Child Tasks */}
                {expandedTasks.has(task.id) &&
                  children.map((child) => (
                    <TaskRow
                      key={child.id}
                      task={child}
                      isChild
                      position={calculateBarPosition(child)}
                      totalDays={totalDays}
                      isHovered={hoveredTask === child.id}
                      onHover={setHoveredTask}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Row Component
interface TaskRowProps {
  task: any;
  hasChildren?: boolean;
  isExpanded?: boolean;
  isChild?: boolean;
  onToggle?: () => void;
  position: { left: string; width: string } | null;
  totalDays: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  getStatusIcon: (status: string) => React.ReactNode;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  hasChildren,
  isExpanded,
  isChild,
  onToggle,
  position,
  totalDays,
  isHovered,
  onHover,
  getStatusIcon,
}) => {
  const typeConfig = task.type
    ? TASK_TYPE_CONFIG[task.type as keyof typeof TASK_TYPE_CONFIG]
    : null;
  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  return (
    <div
      className={`flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        isHovered ? 'bg-gray-50 dark:bg-gray-800/50' : ''
      }`}
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Task Info Column */}
      <div
        className={`w-80 flex-shrink-0 px-6 py-4 border-r border-gray-200 dark:border-gray-700 ${
          isChild ? 'pl-12' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              onClick={onToggle}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && !isChild && <div className="w-5" />}

          {getStatusIcon(task.status)}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {typeConfig && <span className="text-xs">{typeConfig.icon}</span>}
              <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                {task.title}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {task.storyPoints && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {task.storyPoints} pts
                </span>
              )}
              {task.assigneeIds.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {task.assigneeIds.length}
                  </span>
                </div>
              )}
              <span className="text-xs">{priorityConfig.icon}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="flex-1 relative py-4">
        {position && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer"
            style={{
              left: position.left,
              width: position.width,
              backgroundColor:
                task.color ||
                (task.status === 'done'
                  ? '#10B981'
                  : task.status === 'in_progress'
                    ? '#3B82F6'
                    : task.status === 'in_review'
                      ? '#8B5CF6'
                      : '#9CA3AF'),
            }}
          >
            <div className="h-full flex items-center justify-between px-3">
              <span className="text-xs font-medium text-white truncate">{task.progress}%</span>
              {task.dependencies.length > 0 && <AlertCircle className="w-3 h-3 text-white/80" />}
            </div>

            {/* Progress Fill */}
            <div
              className="absolute inset-0 bg-white/20 rounded-lg"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}

        {!position && (
          <div className="absolute top-1/2 left-4 -translate-y-1/2">
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">No dates set</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;
