// TaskCard.tsx - Professional & Polished Version
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
  Calendar,
  Target,
  Timer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../modals/ConfirmModal';

interface TaskCardProps {
  task: TaskResponse;
  isDragging?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

// Priority icons for visual enhancement
const PriorityIcon: React.FC<{ priority: Priority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return <AlertTriangle className="w-3 h-3" />;
    case 'high':
      return <Zap className="w-3 h-3" />;
    default:
      return null;
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false, variant = 'default' }) => {
  const { openTaskModal, deleteTask } = useProjectContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
  const isOverdue = dueInfo?.color?.includes('red');
  const isDueSoon = dueInfo?.color?.includes('yellow');

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
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-violet-400 to-violet-600',
      'bg-gradient-to-br from-emerald-400 to-emerald-600',
      'bg-gradient-to-br from-amber-400 to-amber-600',
      'bg-gradient-to-br from-rose-400 to-rose-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600',
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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            group relative ml-4 mb-2 p-2.5 rounded-xl cursor-pointer
            border border-gray-200/60 dark:border-gray-700/60
            bg-gradient-to-r from-gray-50/80 to-white/80 
            dark:from-gray-800/40 dark:to-gray-850/40
            backdrop-blur-sm
            transition-all duration-300 ease-out
            hover:border-gray-300 dark:hover:border-gray-600
            hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]
            dark:hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]
            ${isDragging ? 'opacity-60 scale-[0.98] rotate-1' : ''}
            ${isHovered ? 'translate-x-1' : ''}
          `}
        >
          {/* Subtle left accent line */}
          <div
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: priorityConfig.color,
              opacity: isHovered ? 1 : 0.5,
            }}
          />

          <div className="flex items-center gap-2.5 pl-2">
            <CornerDownRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />

            <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-1 tracking-tight">
              {task.title}
            </span>

            {dueInfo && (
              <div
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold
                  transition-all duration-200
                  ${
                    isOverdue
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/40'
                      : isDueSoon
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/40'
                  }
                `}
              >
                <Clock className="w-3 h-3" />
                <span>{dueInfo.text}</span>
              </div>
            )}

            {assigneeIds.length > 0 && (
              <div className="flex -space-x-1.5">
                {assigneeIds.slice(0, 2).map((userId, idx) => {
                  const initials = initialsByUserId[userId] || '?';
                  return (
                    <div
                      key={userId}
                      className={`
                        w-5 h-5 rounded-full ${getAssigneeColor(idx)} 
                        flex items-center justify-center text-[9px] font-bold text-white 
                        ring-2 ring-white dark:ring-gray-800
                        transition-transform duration-200 hover:scale-110 hover:z-10
                        shadow-sm
                      `}
                    >
                      {isLoading ? '' : initials}
                    </div>
                  );
                })}
                {assigneeIds.length > 2 && (
                  <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-800">
                    +{assigneeIds.length - 2}
                  </div>
                )}
              </div>
            )}

            {/* Menu */}
            <div
              ref={menuRef}
              className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-200/80 dark:hover:bg-gray-700/80 text-gray-400 dark:text-gray-500 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div
                  className="
                    absolute right-0 top-8 w-40 py-1.5
                    bg-white dark:bg-gray-800 
                    border border-gray-200 dark:border-gray-700 
                    rounded-xl shadow-xl dark:shadow-2xl
                    z-50 overflow-hidden
                    animate-in fade-in slide-in-from-top-2 duration-200
                  "
                >
                  <button
                    className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2.5 text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={() => {
                      openTaskModal(task as any);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Subtask
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-2.5 transition-colors"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
          message="Are you sure you want to delete this subtask? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      </>
    );
  }

  // ============================================
  // PARENT TASK PROFESSIONAL DESIGN
  // ============================================
  return (
    <>
      <div
        onClick={() => openTaskModal(task as any)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative mb-3 rounded-2xl cursor-pointer overflow-hidden
          bg-white dark:bg-gray-900
          border border-gray-200/80 dark:border-gray-800
          transition-all duration-300 ease-out
          hover:border-gray-300 dark:hover:border-gray-700
          hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)]
          dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)]
          ${isDragging ? 'opacity-60 scale-[0.98] rotate-2 shadow-2xl' : ''}
          ${isHovered ? '-translate-y-0.5' : ''}
        `}
      >
        {/* Priority accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, ${priorityConfig.color}, ${priorityConfig.color}88)`,
            opacity: isHovered ? 1 : 0.7,
          }}
        />

        {/* Blocked indicator overlay */}
        {task.blocked && (
          <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 pointer-events-none" />
        )}

        <div className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Type Badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-transform duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${typeConfig.color}12`,
                  border: `1px solid ${typeConfig.color}30`,
                }}
              >
                <span className="text-sm" style={{ color: typeConfig.color }}>
                  {typeConfig.icon}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: typeConfig.color }}
                >
                  {typeKey}
                </span>
              </div>

              {/* Priority Badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-transform duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${priorityConfig.color}12`,
                  border: `1px solid ${priorityConfig.color}30`,
                }}
              >
                <PriorityIcon priority={priorityKey} />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: priorityConfig.color }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: priorityConfig.color }}
                >
                  {priorityConfig.name}
                </span>
              </div>

              {/* Blocked Badge */}
              {task.blocked && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Blocked
                  </span>
                </div>
              )}
            </div>

            {/* Menu Button */}
            <div
              ref={menuRef}
              className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="
                    absolute right-0 top-9 w-44 py-1.5
                    bg-white dark:bg-gray-800 
                    border border-gray-200 dark:border-gray-700 
                    rounded-xl shadow-xl dark:shadow-2xl
                    z-50 overflow-hidden
                    animate-in fade-in slide-in-from-top-2 duration-200
                  "
                >
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={() => {
                      openTaskModal(task as any);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Task
                  </button>
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <hr className="my-1.5 border-gray-100 dark:border-gray-700" />
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors"
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
          <h4 className="font-semibold text-[15px] text-gray-900 dark:text-white leading-snug mb-3 line-clamp-2 tracking-tight">
            {task.title}
          </h4>

          {/* Description Preview (if exists) */}
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta Info Row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {/* Story Points */}
            {task.storyPoints && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40 transition-transform hover:scale-105">
                <Target className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                  {task.storyPoints} pts
                </span>
              </div>
            )}

            {/* Estimated Hours */}
            {task.estimatedHours && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800/40 transition-transform hover:scale-105">
                <Timer className="w-3 h-3 text-violet-500 dark:text-violet-400" />
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                  {task.estimatedHours}h est
                </span>
              </div>
            )}

            {/* Due Date */}
            {dueInfo && (
              <div
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-transform hover:scale-105
                  ${
                    isOverdue
                      ? 'bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40'
                      : isDueSoon
                        ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40'
                        : 'bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/40'
                  }
                `}
              >
                <Calendar className={`w-3 h-3 ${dueInfo.color}`} />
                <span className={`text-[10px] font-bold ${dueInfo.color}`}>{dueInfo.text}</span>
              </div>
            )}

            {/* Watchers Count */}
            {task.watcherIds && task.watcherIds.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/40">
                <Eye className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  {task.watcherIds.length}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            {/* Subtask Progress */}
            {task.subtaskCount > 0 ? (
              <div className="flex items-center gap-2.5 flex-1 mr-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
                    style={{ width: '0%' }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                  0/{task.subtaskCount}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Assignees */}
            {assigneeIds.length > 0 ? (
              <div className="flex -space-x-2">
                {assigneeIds.slice(0, 4).map((userId, idx) => {
                  const initials = initialsByUserId[userId] || '?';
                  return (
                    <div
                      key={userId}
                      className={`
                        w-7 h-7 rounded-full ${getAssigneeColor(idx)} 
                        flex items-center justify-center text-[10px] font-bold text-white 
                        ring-2 ring-white dark:ring-gray-900
                        transition-all duration-200 hover:scale-110 hover:z-10 hover:-translate-y-0.5
                        shadow-md cursor-pointer
                      `}
                      title={`Assigned to ${initials}`}
                    >
                      {isLoading ? '' : initials}
                    </div>
                  );
                })}
                {assigneeIds.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 shadow-md">
                    +{assigneeIds.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer"
                title="Unassigned - Click to assign"
              >
                <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
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
        message="Are you sure you want to delete this task? All subtasks will also be deleted. This action cannot be undone."
        confirmText="Delete Task"
        variant="danger"
      />
    </>
  );
};

export default TaskCard;
