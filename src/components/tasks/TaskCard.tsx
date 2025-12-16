// src/components/tasks/TaskCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Task, PRIORITY_CONFIG, TASK_TYPE_CONFIG, Priority, TaskType } from '../../types/project';
import { useProject } from '../../context/ProjectContext';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false, compact = false }) => {
  const { openTaskModal, deleteTask } = useProject();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Safely get config - handle both uppercase and lowercase
  const priorityKey = (task.priority?.toLowerCase() || 'medium') as Priority;
  const typeKey = (task.type?.toLowerCase() || 'task') as TaskType;

  const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.medium;
  const typeConfig = TASK_TYPE_CONFIG[typeKey] || TASK_TYPE_CONFIG.task;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDate = (date?: Date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-error-500' };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-warning-500' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-warning-500' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d`, color: 'text-gray-500' };
    }
    return {
      text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: 'text-gray-500',
    };
  };

  const dueInfo = formatDate(task.dueDate);

  return (
    <div
      onClick={() => openTaskModal(task)}
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

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{task.key}</span>

        <div className="flex-1" />

        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityConfig.color }} />
      </div>

      {/* Title */}
      <h4
        className={`font-medium text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-sm'} line-clamp-2 mb-3`}
      >
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">
              +{task.labels.length - 3}
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

          {task.subtasks && task.subtasks.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                />
              </svg>
              {task.subtasks.filter((s) => s.status === 'done').length}/{task.subtasks.length}
            </span>
          )}

          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {task.comments.length}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee ? (
          <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800">
            {task.assignee.avatar ? (
              <img
                src={task.assignee.avatar}
                alt={task.assignee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">
                {task.assignee.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* --- Hover Menu Button (⋮) --- */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        ref={menuRef}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {/* Quick Action Menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                openTaskModal(task);
                setMenuOpen(false);
              }}
            >
              ✏️ Edit Task
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href + `?task=${task.id}`);
                setMenuOpen(false);
              }}
            >
              🔗 Copy Link
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                deleteTask(task.id);
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
