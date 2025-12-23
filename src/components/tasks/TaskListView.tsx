// src/components/TaskListView/TaskListView.tsx
import React, { useState } from 'react';
import { TaskStatus, STATUS_COLUMNS, PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { TaskResponse, useUpdateTaskStatus } from '../../hooks/api/useTasks';
import { formatDateDisplay } from '../../utils/dateUtils';
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square,
  Clock,
  User,
} from 'lucide-react';

interface TaskListViewProps {
  tasks: TaskResponse[];
  groupBy?: 'status' | 'priority' | 'assignee' | 'none';
}

interface TaskRowProps {
  task: TaskResponse;
}

const TaskRow: React.FC<TaskRowProps> = ({ task }) => {
  const { openTaskModal } = useProject();
  const updateStatusMutation = useUpdateTaskStatus();

  const typeConfig = TASK_TYPE_CONFIG[task.type || 'task'];
  const priorityConfig = PRIORITY_CONFIG[task.priority || 'medium'];
  const statusConfig = STATUS_COLUMNS.find((s) => s.id === task.status);

  const dueInfo = formatDateDisplay(task.dueDate);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: task.id,
        status: newStatus as TaskStatus,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <tr
      onClick={() => openTaskModal(task as any)}
      className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-all"
    >
      {/* Checkbox */}
      <td className="px-4 py-4 w-12">
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center">
          <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" />
        </div>
      </td>

      {/* Key */}
      <td className="px-4 py-4 w-32">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-lg shadow-sm"
            style={{
              backgroundColor: `${typeConfig.color}15`,
              border: `1px solid ${typeConfig.color}40`,
            }}
          >
            <span className="text-xs" style={{ color: typeConfig.color }}>
              {typeConfig.icon}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400">
            {task.id.slice(0, 8)}
          </span>
        </div>
      </td>

      {/* Title */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
            {task.title}
          </span>
          {task.labelIds && task.labelIds.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {task.labelIds.slice(0, 2).map((labelId, idx) => (
                <div
                  key={labelId}
                  className="w-2 h-2 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 shadow-sm"
                  title="Label"
                />
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4 w-40">
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation();
            handleStatusChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          disabled={updateStatusMutation.isPending}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold border-2 cursor-pointer transition-all disabled:opacity-50 shadow-sm hover:shadow"
          style={{
            backgroundColor: `${statusConfig?.color}15`,
            color: statusConfig?.color,
            borderColor: `${statusConfig?.color}40`,
          }}
        >
          {STATUS_COLUMNS.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </td>

      {/* Priority */}
      <td className="px-4 py-4 w-32">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit"
          style={{ backgroundColor: `${priorityConfig.color}15` }}
        >
          <div
            className="w-2 h-2 rounded-full shadow-sm"
            style={{ backgroundColor: priorityConfig.color }}
          />
          <span
            className="text-xs font-semibold capitalize"
            style={{ color: priorityConfig.color }}
          >
            {priorityConfig.name}
          </span>
        </div>
      </td>

      {/* Assignees */}
      <td className="px-4 py-4 w-44">
        {task.assigneeIds && task.assigneeIds.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {task.assigneeIds.slice(0, 3).map((assigneeId, idx) => (
                <div
                  key={assigneeId}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800 shadow-sm ${
                    idx === 0
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                      : idx === 1
                        ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                        : 'bg-gradient-to-br from-green-400 to-green-600'
                  }`}
                  title="Assignee"
                >
                  {idx + 1}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {task.assigneeIds.length} assigned
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600">
            <User className="w-4 h-4" />
            <span className="text-xs font-medium">Unassigned</span>
          </div>
        )}
      </td>

      {/* Story Points */}
      <td className="px-4 py-4 w-24 text-center">
        {task.storyPoints ? (
          <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/50 dark:to-brand-900/30 text-xs font-bold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 shadow-sm">
            {task.storyPoints}
          </span>
        ) : (
          <span className="text-gray-300 dark:text-gray-700">—</span>
        )}
      </td>

      {/* Due Date */}
      <td className="px-4 py-4 w-36">
        {dueInfo ? (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit ${
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
        ) : (
          <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-4 w-16">
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </td>
    </tr>
  );
};

interface TaskGroupProps {
  title: string;
  color?: string;
  tasks: TaskResponse[];
  isOpen: boolean;
  onToggle: () => void;
}

const TaskGroup: React.FC<TaskGroupProps> = ({ title, color, tasks, isOpen, onToggle }) => {
  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 rounded-xl transition-all border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400 transition-transform" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 transition-transform" />
        )}
        {color && (
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
        )}
        <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        <span className="ml-auto px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full">
          {tasks.length}
        </span>
      </button>
      {isOpen && tasks.length > 0 && (
        <div className="mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <table className="w-full">
            <tbody>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, groupBy = 'status' }) => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(STATUS_COLUMNS.map((s) => s.id))
  );

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (groupBy === 'none') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-4 w-12">
                <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32">
                Key
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-40">
                Status
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32">
                Priority
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-44">
                Assignees
              </th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-24">
                Points
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-36">
                Due Date
              </th>
              <th className="px-4 py-4 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Square className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-gray-400 dark:text-gray-600 font-medium">No tasks found</p>
          </div>
        )}
      </div>
    );
  }

  // Group by status
  if (groupBy === 'status') {
    return (
      <div className="space-y-3">
        {STATUS_COLUMNS.map((status) => {
          const groupTasks = tasks.filter((t) => t.status === status.id);
          return (
            <TaskGroup
              key={status.id}
              title={status.name}
              color={status.color}
              tasks={groupTasks}
              isOpen={openGroups.has(status.id)}
              onToggle={() => toggleGroup(status.id)}
            />
          );
        })}
      </div>
    );
  }

  return null;
};

export default TaskListView;
