import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, Priority, TaskType, STATUS_COLUMNS, PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { useAddComment, useCreateLabel, useDeleteComment, useDeleteTask, useLabels, useTaskComments, useUpdateTask } from '../../hooks/api';
import { useProjectUsers } from '../../hooks/useUser';
import { useAddLabelToTask, useRemoveLabelFromTask } from '../../hooks/api/useLabels';


const TaskDetailModal: React.FC = () => {
  const {
    selectedTask,
    isTaskModalOpen,
    closeTaskModal,
    currentProject,
  } = useProject();

  // Fetch dynamic data from API
  const { data: comments, refetch: refetchComments } = useTaskComments(selectedTask?.id || '');
  const { data: projectUsers } = useProjectUsers(currentProject?.id || '');
  const { data: projectLabels } = useLabels(currentProject?.id || '');

  // Mutations
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const createLabelMutation = useCreateLabel();
  const addLabelToTaskMutation = useAddLabelToTask();
  const removeLabelFromTaskMutation = useRemoveLabelFromTask();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as Priority,
    type: 'task' as TaskType,
    assigneeId: '',
    storyPoints: undefined as number | undefined,
    dueDate: '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const labelMenuRef = useRef<HTMLDivElement>(null);

  // Initialize form when task loads
  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        status: selectedTask.status,
        priority: selectedTask.priority,
        type: selectedTask.type,
        assigneeId: selectedTask.assignee?.id || '',
        storyPoints: selectedTask.storyPoints,
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '',
      });
      setHasChanges(false);
    }
  }, [selectedTask]);

  // Close label menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labelMenuRef.current && !labelMenuRef.current.contains(event.target as Node)) {
        setShowLabelMenu(false);
        setIsCreatingLabel(false);
      }
    };

    if (showLabelMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLabelMenu]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasChanges) {
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            closeTaskModal();
          }
        } else {
          closeTaskModal();
        }
      }
    };

    if (isTaskModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isTaskModalOpen, closeTaskModal, hasChanges]);

  // Refetch comments when modal opens
  useEffect(() => {
    if (isTaskModalOpen && selectedTask) {
      refetchComments();
    }
  }, [isTaskModalOpen, selectedTask, refetchComments]);

  if (!isTaskModalOpen || !selectedTask || !currentProject) return null;

  const users = projectUsers || [];
  const labels = projectLabels || [];

  // Update form field and mark as changed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        data: {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          type: formData.type,
          assigneeId: formData.assigneeId || undefined,
          storyPoints: formData.storyPoints,
          dueDate: formData.dueDate || undefined,
        }
      });
      
      setHasChanges(false);
      closeTaskModal();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTask) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTaskMutation.mutateAsync(selectedTask.id);
        closeTaskModal();
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setFormData({
          title: selectedTask.title,
          description: selectedTask.description || '',
          status: selectedTask.status,
          priority: selectedTask.priority,
          type: selectedTask.type,
          assigneeId: selectedTask.assignee?.id || '',
          storyPoints: selectedTask.storyPoints,
          dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '',
        });
        setHasChanges(false);
      }
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

    try {
      await addCommentMutation.mutateAsync({
        taskId: selectedTask.id,
        content: newComment.trim(),
      });
      setNewComment('');
      // Refetch comments to show the new one
      refetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteCommentMutation.mutateAsync({
          taskId: selectedTask.id,
          commentId,
        });
        refetchComments();
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
      }
    }
  };

  // Create new label
  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      const newLabel = await createLabelMutation.mutateAsync({
        projectId: currentProject.id,
        data: {
          name: newLabelName.trim(),
          color: newLabelColor,
        },
      });

      // Add the new label to the task
      await addLabelToTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        labelId: newLabel.id,
      });

      setNewLabelName('');
      setNewLabelColor('#6366f1');
      setIsCreatingLabel(false);
    } catch (error) {
      console.error('Failed to create label:', error);
      alert('Failed to create label. Please try again.');
    }
  };

  // Add label to task
  const handleAddLabel = async (labelId: string) => {
    try {
      await addLabelToTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        labelId,
      });
      setShowLabelMenu(false);
    } catch (error) {
      console.error('Failed to add label:', error);
      alert('Failed to add label. Please try again.');
    }
  };

  // Remove label from task
  const handleRemoveLabel = async (labelId: string) => {
    try {
      await removeLabelFromTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        labelId,
      });
    } catch (error) {
      console.error('Failed to remove label:', error);
      alert('Failed to remove label. Please try again.');
    }
  };

  const typeConfig = TASK_TYPE_CONFIG[formData.type];
  const statusConfig = STATUS_COLUMNS.find(s => s.id === formData.status);
  const isSaving = updateTaskMutation.isPending;
  const isDeleting = deleteTaskMutation.isPending;

  // Get task labels (from selectedTask, as they're part of the task data)
  const taskLabels = selectedTask.labels || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={() => {
          if (hasChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
              closeTaskModal();
            }
          } else {
            closeTaskModal();
          }
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeConfig.icon}</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {selectedTask.key}
              </span>
              {hasChanges && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 text-gray-500 hover:text-error-600 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {isDeleting ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  if (hasChanges) {
                    if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                      closeTaskModal();
                    }
                  } else {
                    closeTaskModal();
                  }
                }}
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
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-brand-500 outline-none rounded px-2 py-1 -mx-2 mb-4 transition-colors"
                placeholder="Task title"
              />

              {/* Status bar */}
              <div className="flex flex-wrap gap-2 mb-6">
                {/* Status */}
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value as TaskStatus)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: `${statusConfig?.color}20`,
                    color: statusConfig?.color,
                  }}
                >
                  {STATUS_COLUMNS.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>

                {/* Priority */}
                <select
                  value={formData.priority}
                  onChange={(e) => updateField('priority', e.target.value as Priority)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 border-0 cursor-pointer"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>

                {/* Type */}
                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value as TaskType)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 border-0 cursor-pointer"
                >
                  {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Add a description..."
                  className="w-full min-h-[120px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Tabs */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                  {(['comments', 'activity'] as const).map(tab => (
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
                      {tab === 'comments' && comments && comments.length > 0 && (
                        <span className="ml-1 text-xs">({comments.length})</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  {/* Comments Tab - DYNAMIC FROM API */}
                  {activeTab === 'comments' && (
                    <div>
                      {/* Add Comment */}
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                            {users[0]?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleAddComment();
                              }
                            }}
                            placeholder="Write a comment... (Ctrl+Enter to send)"
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                            rows={2}
                          />
                          {newComment.trim() && (
                            <button
                              onClick={handleAddComment}
                              disabled={addCommentMutation.isPending}
                              className="mt-2 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
                            >
                              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Comments List - FROM API */}
                      {!comments || comments.length === 0 ? (
                        <p className="text-center text-gray-400 mt-6">No comments yet</p>
                      ) : (
                        <div className="space-y-4">
                          {comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                {comment.user?.avatar ? (
                                  <img
                                    src={comment.user.avatar}
                                    alt=""
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {comment.user?.name?.charAt(0) || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {comment.user?.name || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs text-gray-400 hover:text-error-600 mt-1"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <div className="text-sm text-gray-500">
                      <div className="flex items-start gap-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {selectedTask.reporter?.name || 'Unknown'}
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

            {/* Right Sidebar - ALL DYNAMIC */}
            <div className="w-72 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Details
              </h3>

              {/* Assignee - DYNAMIC */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Assignee
                </label>
                <select
                  value={formData.assigneeId}
                  onChange={(e) => updateField('assigneeId', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Reporter - DYNAMIC */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Reporter
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {selectedTask.reporter?.avatar ? (
                    <img
                      src={selectedTask.reporter.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-600">
                      {selectedTask.reporter?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-sm">{selectedTask.reporter?.name || 'Unknown'}</span>
                </div>
              </div>

              {/* Labels - DYNAMIC WITH ADD/REMOVE */}
              <div className="mb-4 relative">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Labels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {taskLabels.map(label => (
                    <span
                      key={typeof label === 'object' ? label.id : label}
                      className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 group"
                      style={{
                        backgroundColor: typeof label === 'object' ? `${label.color}20` : '#e5e7eb',
                        color: typeof label === 'object' ? label.color : '#6b7280'
                      }}
                    >
                      {typeof label === 'object' ? label.name : label}
                      <button
                        onClick={() => handleRemoveLabel(typeof label === 'object' ? label.id : label)}
                        className="opacity-0 group-hover:opacity-100 hover:text-error-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setShowLabelMenu(!showLabelMenu)}
                    className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    + Add
                  </button>
                </div>

                {/* Label Menu */}
                {showLabelMenu && (
                  <div
                    ref={labelMenuRef}
                    className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10"
                  >
                    {isCreatingLabel ? (
                      <div className="p-2">
                        <input
                          type="text"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="Label name"
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-sm mb-2"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <span className="text-xs text-gray-500">{newLabelColor}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateLabel}
                            disabled={!newLabelName.trim()}
                            className="flex-1 px-2 py-1 bg-brand-500 text-white rounded text-xs hover:bg-brand-600 disabled:opacity-50"
                          >
                            Create
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingLabel(false);
                              setNewLabelName('');
                            }}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-48 overflow-y-auto">
                          {labels.map(label => (
                            <button
                              key={label.id}
                              onClick={() => handleAddLabel(label.id)}
                              className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <span
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: label.color }}
                              />
                              {label.name}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setIsCreatingLabel(true)}
                          className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-brand-500 mt-1 border-t border-gray-200 dark:border-gray-700"
                        >
                          + Create new label
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Story Points */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Story Points
                </label>
                <input
                  type="number"
                  value={formData.storyPoints || ''}
                  onChange={(e) => updateField('storyPoints', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  placeholder="Estimate"
                  min="0"
                />
              </div>

              {/* Due Date - WITH CALENDAR */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm cursor-pointer"
                    style={{
                      colorScheme: 'light dark',
                    }}
                  />
                  {formData.dueDate && (
                    <button
                      onClick={() => updateField('dueDate', '')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Clear date"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Created/Updated - DYNAMIC */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Created {new Date(selectedTask.createdAt).toLocaleDateString()}</p>
                  <p>Updated {new Date(selectedTask.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Save/Cancel */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {hasChanges && (
                <span className="text-orange-600 dark:text-orange-400">
                  You have unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || !formData.title.trim()}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;