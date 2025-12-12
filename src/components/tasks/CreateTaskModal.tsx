import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, Priority, TaskType, STATUS_COLUMNS, PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import { useProject } from '../../context/ProjectContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: TaskStatus;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, initialStatus = 'todo' }) => {
  const { createTask, users, labels } = useProject();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<Priority>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [storyPoints, setStoryPoints] = useState<number | undefined>();
  const [dueDate, setDueDate] = useState<string>('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      titleInputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignee = assigneeId ? users.find(u => u.id === assigneeId) : undefined;
    const taskLabels = labels.filter(l => selectedLabels.includes(l.id));

    createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      type,
      assignee,
      reporter: users[0], // Current user
      labels: taskLabels,
      storyPoints,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      comments: [],
      attachments: [],
      subtasks: [],
      order: 0,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setType('task');
    setAssigneeId('');
    setSelectedLabels([]);
    setStoryPoints(undefined);
    setDueDate('');

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-y-12 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 z-50 flex items-start justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Task</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Title */}
            <div className="mb-4">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              {/* Type */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 border-0 cursor-pointer"
              >
                {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.name}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer"
                style={{
                  backgroundColor: `${STATUS_COLUMNS.find(s => s.id === status)?.color}20`,
                  color: STATUS_COLUMNS.find(s => s.id === status)?.color,
                }}
              >
                {STATUS_COLUMNS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Priority */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 border-0 cursor-pointer"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={4}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Story Points
                </label>
                <input
                  type="number"
                  value={storyPoints || ''}
                  onChange={(e) => setStoryPoints(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {labels.slice(0, 4).map(label => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => {
                        setSelectedLabels(prev =>
                          prev.includes(label.id)
                            ? prev.filter(id => id !== label.id)
                            : [...prev, label.id]
                        );
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        selectedLabels.includes(label.id)
                          ? 'ring-2 ring-offset-1 ring-current'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateTaskModal;
