// src/components/TaskCard/TaskCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG, Priority, TaskType } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { TaskResponse } from '../../hooks/api/useTasks';
import { formatDateDisplay } from '../../utils/dateUtils';

interface TaskCardProps {
  task: TaskResponse; // ✅ Use TaskResponse from API
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
  // DATE FORMAT (Using utility)
  // ===============================
  const dueInfo = formatDateDisplay(task.dueDate);

  // ===============================
  // ASSIGNEES - ✅ FIXED: Use assigneeIds array
  // ===============================
  const hasAssignees = task.assigneeIds && task.assigneeIds.length > 0;
  const assigneeCount = task.assigneeIds?.length || 0;

  // ===============================
  // UI
  // ===============================
  return (
    <div
      onClick={() => openTaskModal(task as any)}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        hover:border-brand-300 dark:hover:border-brand-600 cursor-pointer transition-all duration-200
        ${isDragging ? 'shadow-lg ring-2 ring-brand-500 opacity-90' : 'hover:shadow-md'}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {/* --- Top Row --- */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex items-center justify-center w-5 h-5 rounded text-xs"
          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          {typeConfig.icon}
        </span>

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {task.id.slice(0, 8)}
        </span>

        <div className="flex-1" />

        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityConfig.color }} />
      </div>

      {/* Title */}
      <h4
        className={`font-medium text-gray-900 dark:text-white line-clamp-2 mb-3 ${
          compact ? 'text-sm' : 'text-sm'
        }`}
      >
        {task.title}
      </h4>

      {/* Labels - ✅ FIXED: Use labelIds array */}
      {task.labelIds?.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.labelIds.slice(0, 3).map((labelId) => (
            <span
              key={labelId}
              className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              Label
            </span>
          ))}
          {task.labelIds.length > 3 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">
              +{task.labelIds.length - 3}
            </span>
          )}
        </div>
      )}

      {/* --- Bottom Row --- */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {task.storyPoints && (
            <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
              {task.storyPoints}
            </span>
          )}

          {dueInfo && (
            <span className={`text-xs font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
          )}
        </div>

        {/* Assignee Indicator - ✅ FIXED: Show count instead of avatar */}
        {hasAssignees ? (
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400 ring-2 ring-white dark:ring-gray-800">
              {assigneeCount}
            </div>
            {assigneeCount > 1 && (
              <span className="text-xs text-gray-500">+{assigneeCount - 1}</span>
            )}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600" />
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
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ⋮
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                openTaskModal(task as any);
                setMenuOpen(false);
              }}
            >
              ✏️ Edit Task
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-error-600"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  deleteTask(task.id);
                }
                setMenuOpen(false);
              }}
            >
              🗑️ Delete Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
