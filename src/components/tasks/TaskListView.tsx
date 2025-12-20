// src/components/TaskListView/TaskListView.tsx
import React, { useState } from 'react';
import { TaskStatus, STATUS_COLUMNS, PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { TaskResponse, useUpdateTaskStatus } from '../../hooks/api/useTasks';
import { formatDateDisplay } from '../../utils/dateUtils';

interface TaskListViewProps {
  tasks: TaskResponse[]; // ✅ Use TaskResponse
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
      onClick={() => openTaskModal(task)}
      className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors"
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-10">
        <input
          type="checkbox"
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500"
        />
      </td>

      {/* Key */}
      <td className="px-3 py-3 w-24">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center w-5 h-5 rounded text-xs"
            style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
          >
            {typeConfig.icon}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {task.id.slice(0, 8)}
          </span>
        </div>
      </td>

      {/* Title */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
            {task.title}
          </span>
          {task.labelIds && task.labelIds.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {task.labelIds.slice(0, 2).map((labelId, idx) => (
                <span key={labelId} className="w-2 h-2 rounded-full bg-gray-400" title="Label" />
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3 w-32">
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation();
            handleStatusChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          disabled={updateStatusMutation.isPending}
          className="px-2.5 py-1 rounded-md text-xs font-medium border-0 cursor-pointer transition-colors disabled:opacity-50"
          style={{
            backgroundColor: `${statusConfig?.color}15`,
            color: statusConfig?.color,
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
      <td className="px-3 py-3 w-28">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: priorityConfig.color }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">{priorityConfig.name}</span>
        </div>
      </td>

      {/* Assignees - ✅ FIXED: Show count */}
      <td className="px-3 py-3 w-40">
        {task.assigneeIds && task.assigneeIds.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
              {task.assigneeIds.length}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {task.assigneeIds.length} assigned
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        )}
      </td>

      {/* Story Points */}
      <td className="px-3 py-3 w-20 text-center">
        {task.storyPoints ? (
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            {task.storyPoints}
          </span>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">-</span>
        )}
      </td>

      {/* Due Date */}
      <td className="px-3 py-3 w-28">
        {dueInfo ? (
          <span className={`text-sm ${dueInfo.color}`}>{dueInfo.text}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-3 w-16">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Open quick actions menu
          }}
          className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
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
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
        <span className="font-medium text-gray-700 dark:text-gray-300">{title}</span>
        <span className="text-sm text-gray-400">({tasks.length})</span>
      </button>
      {isOpen && tasks.length > 0 && (
        <div className="mt-2">
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                Key
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                Priority
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                Assignees
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                Points
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                Due Date
              </th>
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="py-12 text-center text-gray-400">No tasks found</div>
        )}
      </div>
    );
  }

  // Group by status
  if (groupBy === 'status') {
    return (
      <div className="space-y-2">
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
