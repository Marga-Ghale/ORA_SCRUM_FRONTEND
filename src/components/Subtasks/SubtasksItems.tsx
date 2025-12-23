// src/components/tasks/SubtasksItems.tsx
import { useState } from 'react';
import { Priority, TaskStatus } from '../../types/project';
import { CheckSquare, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { StatusDropdown } from '../tasks/StatusDropdown';
import { PriorityDropdown } from '../tasks/PriorityDropdown';

// ✅ UPDATED: Match backend SubtaskRequest
export interface SubtaskFormData {
  id?: string; // Optional for new subtasks
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeIds?: string[];
  estimatedHours?: number;
  storyPoints?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SubtaskItemProps {
  subtask: SubtaskFormData;
  users: User[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SubtaskFormData>) => void;
  index: number; // For new subtasks without ID
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  users,
  onDelete,
  onUpdate,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemId = subtask.id || `new-${index}`;

  return (
    <div className="group border-l-2 border-gray-200 dark:border-gray-700 pl-4 hover:border-brand-400 dark:hover:border-brand-500 transition-colors">
      <div className="flex items-center gap-3 py-2.5">
        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </button>

        {/* Icon */}
        <CheckSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />

        {/* Title */}
        <input
          type="text"
          value={subtask.title}
          onChange={(e) => onUpdate(itemId, { title: e.target.value })}
          placeholder="Subtask name"
          className="flex-1 text-sm bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        {/* Status Badge */}
        {subtask.status && (
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-medium text-gray-600 dark:text-gray-400 capitalize">
            {subtask.status.replace('_', ' ')}
          </span>
        )}

        {/* Priority Icon */}
        {subtask.priority && (
          <span className="text-base flex-shrink-0">
            {subtask.priority === 'urgent' && '🔴'}
            {subtask.priority === 'high' && '🟠'}
            {subtask.priority === 'medium' && '🟡'}
            {subtask.priority === 'low' && '🟢'}
            {subtask.priority === 'none' && '⚪'}
          </span>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(itemId)}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 ml-8 space-y-3 pb-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          {/* Description */}
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 pt-2">
              Description:
            </span>
            <textarea
              value={subtask.description || ''}
              onChange={(e) => onUpdate(itemId, { description: e.target.value })}
              placeholder="Add description..."
              rows={2}
              className="flex-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20">
              Status:
            </span>
            <StatusDropdown
              value={subtask.status || 'todo'}
              onChange={(status) => onUpdate(itemId, { status })}
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20">
              Priority:
            </span>
            <PriorityDropdown
              value={subtask.priority || 'medium'}
              onChange={(priority) => onUpdate(itemId, { priority })}
            />
          </div>

          {/* Story Points */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20">
              Points:
            </span>
            <input
              type="number"
              value={subtask.storyPoints || ''}
              onChange={(e) =>
                onUpdate(itemId, { storyPoints: parseInt(e.target.value) || undefined })
              }
              placeholder="0"
              min="0"
              className="w-20 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Assignees */}
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 pt-2">
              Assignees:
            </span>
            <div className="flex-1 space-y-2">
              {users.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No members available</p>
              ) : (
                users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.assigneeIds?.includes(user.id) || false}
                      onChange={(e) => {
                        const currentAssignees = subtask.assigneeIds || [];
                        const newAssignees = e.target.checked
                          ? [...currentAssignees, user.id]
                          : currentAssignees.filter((id) => id !== user.id);
                        onUpdate(itemId, { assigneeIds: newAssignees });
                      }}
                      className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
