// ============================================
// SUBTASKS SECTION
// ============================================

import { useState } from 'react';
import { SubtaskFormData, SubtaskItem } from './SubtasksItems';
import { CheckSquare, Plus } from 'lucide-react';
import { User } from '../../types/project';

interface SubtasksSectionProps {
  subtasks: SubtaskFormData[];
  users: User[];
  onAddSubtask: (title: string) => void;
  onDeleteSubtask: (id: string) => void;
  onUpdateSubtask: (id: string, updates: Partial<SubtaskFormData>) => void;
}

export const SubtasksSection: React.FC<SubtasksSectionProps> = ({
  subtasks,
  users,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
}) => {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CheckSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subtasks</h3>
        {subtasks.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium">
            {subtasks.length}
          </span>
        )}
      </div>

      {/* Subtask List */}
      {subtasks.length > 0 && (
        <div className="space-y-1">
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              users={users}
              onDelete={onDeleteSubtask}
              onUpdate={onUpdateSubtask}
            />
          ))}
        </div>
      )}

      {/* Add New Subtask */}
      {isAddingSubtask ? (
        <div className="flex items-center gap-2 pl-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-brand-400 p-3">
          <CheckSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubtask();
              if (e.key === 'Escape') {
                setIsAddingSubtask(false);
                setNewSubtaskTitle('');
              }
            }}
            placeholder="Subtask name"
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white"
          />
          <button
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            className="px-4 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAddingSubtask(false);
              setNewSubtaskTitle('');
            }}
            className="px-4 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingSubtask(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all w-full"
        >
          <Plus className="w-4 h-4" />
          Add subtask
        </button>
      )}

      {/* Empty State */}
      {subtasks.length === 0 && !isAddingSubtask && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
          <CheckSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No subtasks yet</p>
          <button
            onClick={() => setIsAddingSubtask(true)}
            className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold"
          >
            + Add your first subtask
          </button>
        </div>
      )}
    </div>
  );
};
