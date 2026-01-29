// TaskCard.tsx - Clean Bordio-Inspired Design
import React, { useState, useRef, useEffect } from 'react';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG, Priority, TaskType } from '../../types/project';
import { TaskResponse } from '../../hooks/api/useTasks';
import { formatDateDisplay } from '../../utils/dateUtils';
import { useUserInitials } from '../../hooks/api/useUserInitials';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  CornerDownRight,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../modals/ConfirmModal';

interface TaskCardProps {
  task: TaskResponse;
  isDragging?: boolean;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false }) => {
  const { openTaskModal, deleteTask } = useProjectContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
    setMenuOpen(false);
  };

  const confirmDelete = async () => {
    try {
      await deleteTask(task.id);
      setShowDeleteModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getAssigneeColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-violet-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-pink-500',
    ];
    return colors[index % colors.length];
  };

  // ============================================
  // SUBTASK CARD - Clean & Compact
  // ============================================
  if (isSubtask) {
    return (
      <>
        <div
          onClick={() => openTaskModal(task as any)}
          style={{
            backgroundColor: `${priorityConfig.color}05`,
          }}
          className={`
            group relative ml-3 mb-1.5 rounded-md cursor-pointer
            border border-gray-200 dark:border-gray-700
            hover:border-gray-300 dark:hover:border-gray-600
            hover:shadow-sm
            transition-all duration-150
            ${isDragging ? 'opacity-50' : ''}
          `}
        >
          <div className="px-2 py-1.5 flex items-center gap-1.5">
            <CornerDownRight className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />

            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityConfig.color }}
            />

            <span className="flex-1 text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
              {task.title}
            </span>

            {assigneeIds.length > 0 && (
              <div className="flex -space-x-1">
                {assigneeIds.slice(0, 2).map((userId, idx) => {
                  const initials = initialsByUserId[userId] || '?';
                  return (
                    <div
                      key={userId}
                      className={`w-4 h-4 rounded-full ${getAssigneeColor(idx)} 
                        flex items-center justify-center text-[7px] font-bold text-white 
                        ring-1 ring-white dark:ring-gray-800`}
                    >
                      {isLoading ? '' : initials}
                    </div>
                  );
                })}
              </div>
            )}

            <div
              ref={menuRef}
              className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <MoreVertical className="w-3 h-3" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-5 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                  <button
                    className="w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      openTaskModal(task as any);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    className="w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-1.5"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          title="Delete Subtask"
          message="Are you sure you want to delete this subtask?"
          confirmText="Delete"
          variant="danger"
        />
      </>
    );
  }

  // ============================================
  // MAIN TASK CARD - Bordio Style
  // ============================================
  return (
    <>
      <div
        onClick={() => openTaskModal(task as any)}
        style={{
          backgroundColor: `${priorityConfig.color}05`,
        }}
        className={`
          task-card group relative mb-2 rounded-lg cursor-pointer
          border border-gray-200 dark:border-gray-800
          hover:border-gray-300 dark:hover:border-gray-700
          hover:shadow-md
          transition-all duration-150
          ${isDragging ? 'opacity-60 shadow-lg' : ''}
        `}
      >
        {/* Subtle Header Background */}
        <div
          className="h-6 rounded-t-lg px-2.5 py-1 flex items-center justify-between border-b border-gray-100 dark:border-gray-800"
          style={{
            backgroundColor: `${priorityConfig.color}12`,
          }}
        >
          {/* Type & Priority Badges */}
          <div className="flex items-center gap-1">
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${typeConfig.color}30`,
                color: typeConfig.color,
              }}
            >
              <span className="text-[9px]">{typeConfig.icon}</span>
              {typeKey}
            </span>

            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${priorityConfig.color}30`,
                color: priorityConfig.color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: priorityConfig.color }}
              />
              {priorityKey}
            </span>

            {task.blocked && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-2.5 h-2.5" />
                BLOCK
              </span>
            )}
          </div>

          {/* Menu Button */}
          <div
            ref={menuRef}
            className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-0.5 rounded hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-400 transition-colors"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-5 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                <button
                  className="w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    openTaskModal(task as any);
                    setMenuOpen(false);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Task
                </button>
                <button
                  className="w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-1.5"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-2.5">
          {/* Title */}
          <h4 className="font-semibold text-[12px] text-gray-900 dark:text-white leading-snug line-clamp-2 mb-2">
            {task.title}
          </h4>

          {/* Footer: Meta + Assignees */}
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
            {/* Left: Meta Info */}
            <div className="flex items-center gap-1.5 text-[9px]">
              {/* Story Points */}
              {task.storyPoints && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-800/30">
                  {task.storyPoints}
                </span>
              )}

              {/* Due Date */}
              {dueInfo && (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-semibold ${dueInfo.color} border border-current/20`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {dueInfo.text}
                </span>
              )}

              {/* Subtask Count */}
              {task.subtaskCount > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  📋 {task.subtaskCount}
                </span>
              )}

              {task.sprintId && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-50 dark:bg-brand-950/30 rounded text-[10px] font-medium text-brand-600 dark:text-brand-400">
                  <Target className="w-2.5 h-2.5" />
                  <span>Sprint</span>
                </div>
              )}
            </div>

            {/* Right: Assignees */}
            {assigneeIds.length > 0 ? (
              <div className="flex -space-x-1">
                {assigneeIds.slice(0, 3).map((userId, idx) => {
                  const initials = initialsByUserId[userId] || '?';
                  return (
                    <div
                      key={userId}
                      className={`
                        w-5 h-5 rounded-full ${getAssigneeColor(idx)} 
                        flex items-center justify-center text-[8px] font-bold text-white 
                        ring-2 ring-white dark:ring-gray-900
                        hover:scale-110 transition-transform duration-150
                      `}
                      title={initials}
                    >
                      {isLoading ? '' : initials}
                    </div>
                  );
                })}
                {assigneeIds.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    +{assigneeIds.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer">
                <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold">+</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        title="Delete Task"
        message="Are you sure you want to delete this task? All subtasks will also be deleted."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default TaskCard;
