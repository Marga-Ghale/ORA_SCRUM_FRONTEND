// TaskCard.tsx - FULL FINAL COMPACT VERSION
import React, { useState, useRef, useEffect } from 'react';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG, Priority, TaskType } from '../../types/project';
import { TaskResponse } from '../../hooks/api/useTasks';
import { formatDateDisplay } from '../../utils/dateUtils';
import { useUserInitials } from '../../hooks/api/useUserInitials';
import { MoreVertical, Edit2, Trash2, Clock, CornerDownRight } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../modals/ConfirmModal';

interface TaskCardProps {
  task: TaskResponse;
  isDragging?: boolean;
}

const getErrorMessage = (error: any): string => {
  return error?.message || 'An unexpected error occurred';
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setMenuOpen(false);
  };

  const confirmDelete = async () => {
    try {
      await deleteTask(task.id);
      setShowDeleteModal(false);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getAssigneeColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    return colors[index % colors.length];
  };

  // ============================================
  // SUBTASK COMPACT DESIGN
  // ============================================
  if (isSubtask) {
    return (
      <>
        <div
          onClick={() => openTaskModal(task as any)}
          className={`group mb-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200 ml-4 ${
            isDragging ? 'opacity-50 scale-95' : 'hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <CornerDownRight className="w-3 h-3 text-gray-400 flex-shrink-0" />

            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityConfig.color }}
            />

            <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
              {task.title}
            </span>

            {dueInfo && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                <Clock className={`w-2.5 h-2.5 ${dueInfo.color}`} />
                <span className={`text-[10px] font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
              </div>
            )}

            {assigneeIds.length > 0 && (
              <div className="flex -space-x-1">
                {assigneeIds.slice(0, 2).map((userId, idx) => {
                  const initials = initialsByUserId[userId] || '?';
                  return (
                    <div
                      key={userId}
                      className={`w-5 h-5 rounded-full ${getAssigneeColor(idx)} flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-white dark:ring-gray-800`}
                    >
                      {isLoading ? '' : initials}
                    </div>
                  );
                })}
                {assigneeIds.length > 2 && (
                  <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-white dark:ring-gray-800">
                    +{assigneeIds.length - 2}
                  </div>
                )}
              </div>
            )}

            <div
              ref={menuRef}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
              >
                <MoreVertical className="w-3 h-3" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-6 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                  <button
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      openTaskModal(task as any);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
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
  // PARENT TASK COMPACT DESIGN
  // ============================================
  return (
    <>
      <div
        onClick={() => openTaskModal(task as any)}
        className={`group mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md cursor-pointer transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-95 shadow-xl' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
              style={{
                backgroundColor: `${typeConfig.color}15`,
                border: `1px solid ${typeConfig.color}40`,
              }}
            >
              <span className="text-xs" style={{ color: typeConfig.color }}>
                {typeConfig.icon}
              </span>
            </div>

            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ backgroundColor: `${priorityConfig.color}15` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: priorityConfig.color }}
              />
              <span
                className="text-[10px] font-semibold uppercase"
                style={{ color: priorityConfig.color }}
              >
                {priorityKey}
              </span>
            </div>
          </div>

          <div
            ref={menuRef}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-2 top-10 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    openTaskModal(task as any);
                    setMenuOpen(false);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2 leading-snug">
          {task.title}
        </h4>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.storyPoints && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                  {task.storyPoints}
                </span>
              </div>
            )}

            {dueInfo && (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
                  dueInfo.color.includes('red')
                    ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
                    : dueInfo.color.includes('yellow')
                      ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Clock className={`w-3 h-3 ${dueInfo.color}`} />
                <span className={`text-[10px] font-semibold ${dueInfo.color}`}>{dueInfo.text}</span>
              </div>
            )}
          </div>

          {/* Assignees */}
          {assigneeIds.length > 0 ? (
            <div className="flex -space-x-1.5">
              {assigneeIds.slice(0, 3).map((userId, idx) => {
                const initials = initialsByUserId[userId] || '?';
                return (
                  <div
                    key={userId}
                    className={`w-6 h-6 rounded-full ${getAssigneeColor(idx)} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 hover:scale-110 transition-transform`}
                  >
                    {isLoading ? '' : initials}
                  </div>
                );
              })}
              {assigneeIds.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                  +{assigneeIds.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <span className="text-[10px]">👤</span>
            </div>
          )}
        </div>

        {/* Subtask count indicator */}
        {task.subtaskCount > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 dark:bg-brand-600 transition-all"
                  style={{ width: '0%' }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                0/{task.subtaskCount}
              </span>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default TaskCard;
