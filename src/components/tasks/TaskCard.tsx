// src/components/TaskCard/TaskCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG, Priority, TaskType } from '../../types/project';
import { TaskResponse } from '../../hooks/api/useTasks';
import { formatDateDisplay } from '../../utils/dateUtils';
import { useUserInitials } from '../../hooks/api/useUserInitials';
import { MoreVertical, Edit2, Trash2, Clock, CheckSquare, CornerDownRight } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';

interface TaskCardProps {
  task: TaskResponse;
  isDragging?: boolean;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false, compact = false }) => {
  const { openTaskModal, deleteTask } = useProjectContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSubtask = !!task.parentTaskId;

  const priorityKey = (task.priority?.toLowerCase() || 'medium') as Priority;
  const typeKey = (task.type?.toLowerCase() || 'task') as TaskType;

  const priorityConfig = PRIORITY_CONFIG[priorityKey] ?? PRIORITY_CONFIG.medium;
  const typeConfig = TASK_TYPE_CONFIG[typeKey] ?? TASK_TYPE_CONFIG.task;

  const assigneeIds = task.assigneeIds ?? [];

  const { initialsByUserId, isLoading } = useUserInitials('project', task.projectId, assigneeIds);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dueInfo = formatDateDisplay(task.dueDate);

  const getAssigneeColor = (index: number) => {
    const colors = [
      {
        bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
        ring: 'ring-blue-500',
        text: 'text-white',
      },
      {
        bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
        ring: 'ring-purple-500',
        text: 'text-white',
      },
      {
        bg: 'bg-gradient-to-br from-green-400 to-green-600',
        ring: 'ring-green-500',
        text: 'text-white',
      },
      {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        ring: 'ring-orange-500',
        text: 'text-white',
      },
    ];
    return colors[index % colors.length];
  };

  const getPriorityStyles = () => {
    const styles = {
      urgent:
        'border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800',
      high: 'border-orange-200 dark:border-orange-900/50 hover:border-orange-300 dark:hover:border-orange-800',
      medium:
        'border-yellow-200 dark:border-yellow-900/50 hover:border-yellow-300 dark:hover:border-yellow-800',
      low: 'border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800',
      none: 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
    };
    return styles[priorityKey] || styles.none;
  };

  // ============================================
  // SUBTASK COMPACT DESIGN
  // ============================================
  if (isSubtask) {
    return (
      <div
        onClick={() => openTaskModal(task as any)}
        className={`
          group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30
          rounded-lg border border-gray-200 dark:border-gray-700
          cursor-pointer transition-all duration-200
          ${isDragging ? 'shadow-lg opacity-70 scale-[0.98]' : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'}
          p-2.5
          ml-25
        `}
      >
        {/* Subtask Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <CornerDownRight className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />

          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: priorityConfig.color }}
          />

          <span className="flex-1 text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">
            {task.title}
          </span>

          <div
            ref={menuRef}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-6 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    openTaskModal(task as any);
                    setMenuOpen(false);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700" />
                <button
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                  onClick={() => {
                    if (window.confirm('Delete this subtask?')) {
                      deleteTask(task.id);
                    }
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Subtask Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {task.storyPoints && (
              <span className="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-[10px] font-bold border border-brand-200 dark:border-brand-800">
                {task.storyPoints}
              </span>
            )}

            {dueInfo && (
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  dueInfo.color.includes('red')
                    ? 'bg-red-50 dark:bg-red-950/30'
                    : dueInfo.color.includes('yellow')
                      ? 'bg-yellow-50 dark:bg-yellow-950/30'
                      : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <Clock className={`w-2.5 h-2.5 ${dueInfo.color}`} />
                <span className={`text-[10px] font-semibold ${dueInfo.color}`}>{dueInfo.text}</span>
              </div>
            )}
          </div>

          {/* Compact Assignees */}
          {assigneeIds.length > 0 ? (
            <div className="flex items-center -space-x-1">
              {assigneeIds.slice(0, 2).map((userId, idx) => {
                const initials = initialsByUserId[userId] || '?';
                const colorScheme = getAssigneeColor(idx);

                return (
                  <div
                    key={userId}
                    className={`w-5 h-5 rounded-full ${colorScheme.bg} flex items-center justify-center text-[9px] font-bold ${colorScheme.text} ring-1 ring-white dark:ring-gray-800 shadow-sm`}
                    title={`Assignee: ${initials}`}
                  >
                    {isLoading ? '.' : initials}
                  </div>
                );
              })}
              {assigneeIds.length > 2 && (
                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-white dark:ring-gray-800">
                  +{assigneeIds.length - 2}
                </div>
              )}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <span className="text-[9px]">👤</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // PARENT TASK FULL DESIGN
  // ============================================
  return (
    <div
      onClick={() => openTaskModal(task as any)}
      className={`
        group relative bg-white dark:bg-gray-900 rounded-xl border-2 
        ${getPriorityStyles()}
        cursor-pointer transition-all duration-200
        ${
          isDragging
            ? 'shadow-2xl ring-4 ring-brand-500/50 opacity-80 scale-105 rotate-2'
            : 'hover:shadow-xl hover:-translate-y-1'
        }
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg shadow-sm"
            style={{
              backgroundColor: `${typeConfig.color}15`,
              border: `1.5px solid ${typeConfig.color}40`,
            }}
          >
            <span className="text-sm" style={{ color: typeConfig.color }}>
              {typeConfig.icon}
            </span>
          </div>

          <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
            {task.id.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{
              backgroundColor: `${priorityConfig.color}15`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full shadow-sm"
              style={{ backgroundColor: priorityConfig.color }}
            />
            <span
              className="text-xs font-semibold capitalize"
              style={{ color: priorityConfig.color }}
            >
              {priorityKey}
            </span>
          </div>

          {/* Menu */}
          <div
            ref={menuRef}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-2 top-12 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    openTaskModal(task as any);
                    setMenuOpen(false);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Task
                </button>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                <button
                  className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this task?')) {
                      deleteTask(task.id);
                    }
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h4
        className={`font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3 leading-tight ${
          compact ? 'text-sm' : 'text-base'
        }`}
      >
        {task.title}
      </h4>

      {/* Labels */}
      {task.labelIds?.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.labelIds.slice(0, 3).map((labelId, idx) => (
            <span
              key={labelId}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            >
              Label {idx + 1}
            </span>
          ))}
          {task.labelIds.length > 3 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              +{task.labelIds.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Subtasks Progress */}
      {task.subtaskCount > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Subtasks
              </span>
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              0/{task.subtaskCount}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
              style={{ width: '0%' }}
            />
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          {task.storyPoints && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950/50 dark:to-brand-900/30 border border-brand-200 dark:border-brand-800">
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">SP</span>
              <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                {task.storyPoints}
              </span>
            </div>
          )}

          {dueInfo && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                dueInfo.color.includes('red')
                  ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50'
                  : dueInfo.color.includes('yellow')
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${dueInfo.color}`} />
              <span className={`text-xs font-semibold ${dueInfo.color}`}>{dueInfo.text}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatars */}
        {assigneeIds.length > 0 ? (
          <div className="flex items-center -space-x-2">
            {assigneeIds.slice(0, 3).map((userId, idx) => {
              const initials = initialsByUserId[userId] || '?';
              const colorScheme = getAssigneeColor(idx);

              return (
                <div
                  key={userId}
                  className={`
                    w-8 h-8 rounded-full ${colorScheme.bg}
                    flex items-center justify-center text-xs font-bold
                    ${colorScheme.text}
                    ring-2 ring-white dark:ring-gray-900
                    hover:scale-110 hover:z-10 transition-all duration-200
                    shadow-lg
                  `}
                  title={`Assignee: ${initials}`}
                >
                  {isLoading ? '...' : initials}
                </div>
              );
            })}

            {assigneeIds.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900 shadow-lg">
                +{assigneeIds.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 group-hover:border-gray-400 dark:group-hover:border-gray-600 transition-colors"
            title="Unassigned"
          >
            <span className="text-xs text-gray-400 dark:text-gray-600">👤</span>
          </div>
        )}
      </div>

      {/* Dragging Indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-brand-500/10 dark:bg-brand-500/20 rounded-xl pointer-events-none" />
      )}
    </div>
  );
};

export default TaskCard;
