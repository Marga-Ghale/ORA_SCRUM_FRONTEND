// src/components/TaskCard/TaskCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG, Priority, TaskType } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { TaskResponse } from '../../hooks/api/useTasks';
import { formatDateDisplay } from '../../utils/dateUtils';
import { useUserInitials } from '../../hooks/api/useUserInitials';

interface TaskCardProps {
  task: TaskResponse;
  isDragging?: boolean;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false, compact = false }) => {
  const { openTaskModal, deleteTask } = useProject();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ===============================
  // SAFE ENUM HANDLING
  // ===============================
  const priorityKey = (task.priority?.toLowerCase() || 'medium') as Priority;
  const typeKey = (task.type?.toLowerCase() || 'task') as TaskType;

  const priorityConfig = PRIORITY_CONFIG[priorityKey] ?? PRIORITY_CONFIG.medium;
  const typeConfig = TASK_TYPE_CONFIG[typeKey] ?? TASK_TYPE_CONFIG.task;

  const assigneeIds = task.assigneeIds ?? [];

  const { initialsByUserId, isLoading } = useUserInitials('project', task.projectId, assigneeIds);

  // ===============================
  // CLOSE MENU ON OUTSIDE CLICK
  // ===============================
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ===============================
  // DATE FORMAT
  // ===============================
  const dueInfo = formatDateDisplay(task.dueDate);

  // ===============================
  // ASSIGNEE COLORS
  // ===============================
  const getAssigneeColor = (index: number) => {
    const colors = [
      {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        ring: 'ring-blue-200 dark:ring-blue-800',
      },
      {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
        ring: 'ring-purple-200 dark:ring-purple-800',
      },
      {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        ring: 'ring-green-200 dark:ring-green-800',
      },
      {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        ring: 'ring-orange-200 dark:ring-orange-800',
      },
    ];
    return colors[index % colors.length];
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div
      onClick={() => openTaskModal(task as any)}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        hover:border-brand-400 dark:hover:border-brand-500 cursor-pointer transition-all duration-200
        ${isDragging ? 'shadow-2xl ring-2 ring-brand-500 opacity-90 scale-105' : 'hover:shadow-lg hover:-translate-y-0.5'}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {/* --- Top Row --- */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold"
          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          {typeConfig.icon}
        </span>

        <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded">
          #{task.id.slice(0, 8)}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: priorityConfig.color }}
            title={`${priorityKey.toUpperCase()} Priority`}
          />
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            {priorityKey}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4
        className={`font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3 leading-snug ${
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
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            >
              Label {idx + 1}
            </span>
          ))}
          {task.labelIds.length > 3 && (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
              +{task.labelIds.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* --- Bottom Row --- */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {task.storyPoints && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500">SP</span>
              <span className="flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 text-sm font-bold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700">
                {task.storyPoints}
              </span>
            </div>
          )}

          {dueInfo && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs">📅</span>
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
                    ring-2 ring-white dark:ring-gray-800 ${colorScheme.ring}
                    hover:scale-110 hover:z-10 transition-transform duration-200
                    shadow-sm
                  `}
                  title={`Assignee: ${initials}`}
                >
                  {isLoading ? '...' : initials}
                </div>
              );
            })}

            {assigneeIds.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-800 shadow-sm">
                +{assigneeIds.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center"
            title="Unassigned"
          >
            <span className="text-xs text-gray-400">👤</span>
          </div>
        )}
      </div>

      {/* --- Menu --- */}
      <div
        ref={menuRef}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <button
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              onClick={() => {
                openTaskModal(task as any);
                setMenuOpen(false);
              }}
            >
              <span>✏️</span>
              <span>Edit Task</span>
            </button>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <button
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  deleteTask(task.id);
                }
                setMenuOpen(false);
              }}
            >
              <span>🗑️</span>
              <span>Delete Task</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
