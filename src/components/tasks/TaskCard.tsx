// src/components/tasks/TaskCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Task, PRIORITY_CONFIG, TASK_TYPE_CONFIG, Priority, TaskType } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { MoreHorizontal, Edit3, Link2, Trash2, MessageSquare, CheckSquare } from 'lucide-react';

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
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatDate = (date?: Date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" };
    } else if (diffDays === 0) {
      return { text: "Today", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" };
    } else if (diffDays === 1) {
      return { text: "Tomorrow", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d`, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" };
    }
    return { text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" };
  };

  const dueInfo = formatDate(task.dueDate);

  return (
    <div
      onClick={() => openTaskModal(task)}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/80
        hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-all duration-150
        ${isDragging ? "shadow-lg ring-2 ring-brand-500/50 rotate-2" : "hover:shadow-sm"}
        ${compact ? "p-3" : "p-3.5"}
      `}
    >
      {/* Top Row - Type, Key, Priority */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-medium"
          style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
        >
          {typeConfig.icon}
        </span>

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {task.key}
        </span>

        <div className="flex-1" />

        {/* Priority indicator */}
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: priorityConfig.color }}
            title={priorityConfig.name}
          />
        </div>
      </div>

      {/* Title */}
      <h4 className={`font-medium text-gray-900 dark:text-gray-100 ${compact ? "text-[13px]" : "text-sm"} line-clamp-2 mb-2.5 leading-snug`}>
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.labels.slice(0, 2).map(label => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: `${label.color}15`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 2 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Bottom Row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          {/* Story Points */}
          {task.storyPoints && (
            <span className="flex items-center justify-center px-1.5 h-5 rounded bg-gray-100 dark:bg-gray-700/80 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              {task.storyPoints}
            </span>
          )}

          {/* Due Date */}
          {dueInfo && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${dueInfo.bg} ${dueInfo.color}`}>
              {dueInfo.text}
            </span>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <CheckSquare className="w-3 h-3" />
              <span className="font-medium">{task.subtasks.filter(s => s.status === "done").length}/{task.subtasks.length}</span>
            </span>
          )}

          {/* Comments */}
          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-3 h-3" />
              <span className="font-medium">{task.comments.length}</span>
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee ? (
          <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 flex-shrink-0">
            {task.assignee.avatar ? (
              <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white">
                {task.assignee.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Hover Menu Button */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        ref={menuRef}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Quick Action Menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition-colors"
              onClick={() => { openTaskModal(task); setMenuOpen(false); }}
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-400" />
              Edit Task
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition-colors"
              onClick={() => { navigator.clipboard.writeText(window.location.href + `?task=${task.id}`); setMenuOpen(false); }}
            >
              <Link2 className="w-3.5 h-3.5 text-gray-400" />
              Copy Link
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

            <button
              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
              onClick={() => { deleteTask(task.id); setMenuOpen(false); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
