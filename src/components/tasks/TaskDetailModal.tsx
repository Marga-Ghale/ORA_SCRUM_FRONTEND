import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, Priority, TaskType, STATUS_COLUMNS, PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import { useProject } from '../../context/ProjectContext';

const TaskDetailModal: React.FC = () => {
  const {
    selectedTask,
    isTaskModalOpen,
    closeTaskModal,
    updateTask,
    deleteTask,
    users,
  } = useProject();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTask) {
      setEditedTitle(selectedTask.title);
      setEditedDescription(selectedTask.description || '');
    }
  }, [selectedTask]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTaskModal();
    };
    if (isTaskModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isTaskModalOpen, closeTaskModal]);

  if (!isTaskModalOpen || !selectedTask) return null;

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== selectedTask.title) {
      updateTask(selectedTask.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleSaveDescription = () => {
    updateTask(selectedTask.id, { description: editedDescription });
  };

  const handleStatusChange = (status: TaskStatus) => {
    updateTask(selectedTask.id, { status });
  };

  const handlePriorityChange = (priority: Priority) => {
    updateTask(selectedTask.id, { priority });
  };

  const handleTypeChange = (type: TaskType) => {
    updateTask(selectedTask.id, { type });
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    const assignee = assigneeId ? users.find(u => u.id === assigneeId) : undefined;
    updateTask(selectedTask.id, { assignee });
  };

  const typeConfig = TASK_TYPE_CONFIG[selectedTask.type];
  const statusConfig = STATUS_COLUMNS.find(s => s.id === selectedTask.status);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={closeTaskModal}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-start justify-center overflow-hidden">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span
                className="flex items-center justify-center w-8 h-8 rounded-lg text-sm"
                style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
              >
                {typeConfig.icon}
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {selectedTask.key}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* Share functionality */}}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                title="Share"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button
                onClick={() => {/* Copy link */}}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                title="Copy link"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              <button
                onClick={() => deleteTask(selectedTask.id)}
                className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 text-gray-500 hover:text-error-600 transition-colors"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={closeTaskModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Title */}
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1 -mx-2"
                  autoFocus
                />
              ) : (
                <h1
                  onClick={() => setIsEditing(true)}
                  className="text-2xl font-bold text-gray-900 dark:text-white cursor-text hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 transition-colors"
                >
                  {selectedTask.title}
                </h1>
              )}

              {/* Status bar */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {/* Status */}
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: `${statusConfig?.color}20`,
                    color: statusConfig?.color,
                  }}
                >
                  {STATUS_COLUMNS.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>

                {/* Priority */}
                <select
                  value={selectedTask.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 border-0 cursor-pointer"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.name}</option>
                  ))}
                </select>

                {/* Type */}
                <select
                  value={selectedTask.type}
                  onChange={(e) => handleTypeChange(e.target.value as TaskType)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 border-0 cursor-pointer"
                >
                  {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  placeholder="Add a description..."
                  className="w-full min-h-[120px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Subtasks */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Subtasks
                  </h3>
                  <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                    + Add subtask
                  </button>
                </div>
                {selectedTask.subtasks.length === 0 ? (
                  <p className="text-sm text-gray-400">No subtasks yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTask.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={subtask.status === 'done'}
                          className="w-4 h-4 rounded border-gray-300"
                          readOnly
                        />
                        <span className={subtask.status === 'done' ? 'line-through text-gray-400' : ''}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                  {(['activity', 'comments'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-brand-500 text-brand-500'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  {activeTab === 'comments' && (
                    <div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                          <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                            JD
                          </span>
                        </div>
                        <textarea
                          placeholder="Write a comment..."
                          className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                          rows={2}
                        />
                      </div>
                      {selectedTask.comments.length === 0 && (
                        <p className="text-center text-gray-400 mt-6">No comments yet</p>
                      )}
                    </div>
                  )}
                  {activeTab === 'activity' && (
                    <div className="text-sm text-gray-500">
                      <div className="flex items-start gap-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {selectedTask.reporter.name}
                          </span>{' '}
                          created this task
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(selectedTask.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-72 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Details
              </h3>

              {/* Assignee */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Assignee
                </label>
                <select
                  value={selectedTask.assignee?.id || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Reporter */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Reporter
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {selectedTask.reporter.avatar ? (
                    <img src={selectedTask.reporter.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-600">
                      {selectedTask.reporter.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm">{selectedTask.reporter.name}</span>
                </div>
              </div>

              {/* Labels */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Labels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTask.labels.map(label => (
                    <span
                      key={label.id}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: `${label.color}20`, color: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                  <button className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                    + Add
                  </button>
                </div>
              </div>

              {/* Story Points */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Story Points
                </label>
                <input
                  type="number"
                  value={selectedTask.storyPoints || ''}
                  onChange={(e) => updateTask(selectedTask.id, { storyPoints: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  placeholder="Estimate"
                  min="0"
                />
              </div>

              {/* Due Date */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Due Date
                </label>
                <input
                  type="date"
                  value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateTask(selectedTask.id, { dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              </div>

              {/* Created/Updated */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Created {new Date(selectedTask.createdAt).toLocaleDateString()}</p>
                  <p>Updated {new Date(selectedTask.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
