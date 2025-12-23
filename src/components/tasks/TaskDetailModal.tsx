// src/components/TaskDetailModal/TaskDetailModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  TaskStatus,
  Priority,
  TaskType,
  STATUS_COLUMNS,
  PRIORITY_CONFIG,
  TASK_TYPE_CONFIG,
} from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import {
  CommentResponse,
  useAddComment,
  useDeleteComment,
  useDeleteTask,
  useTaskComments,
  useUpdateTask,
  useTaskActivity,
  ActivityResponse,
} from '../../hooks/api/useTasks';
import { useEffectiveMembers } from '../../hooks/api/useMembers';
import { dateToISO, isoToDate, formatRelativeTime } from '../../utils/dateUtils';
import {
  X,
  Save,
  Trash2,
  Send,
  Calendar,
  User,
  Target,
  Clock,
  MessageSquare,
  Activity,
} from 'lucide-react';

const TaskDetailModal: React.FC = () => {
  const { selectedTask, isTaskModalOpen, closeTaskModal, currentProject } = useProject();

  const { data: commentsData, refetch: refetchComments } = useTaskComments(selectedTask?.id || '', {
    enabled: !!selectedTask?.id,
  });

  const { data: activityData } = useTaskActivity(selectedTask?.id || '', 50, {
    enabled: !!selectedTask?.id,
  });

  const { data: membersData } = useEffectiveMembers('project', currentProject?.id || '', {
    enabled: !!currentProject?.id,
  });

  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as Priority,
    type: 'task' as TaskType,
    assigneeIds: [] as string[],
    labelIds: [] as string[],
    storyPoints: undefined as number | undefined,
    dueDate: '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const comments: CommentResponse[] = commentsData || [];
  const activities: ActivityResponse[] = activityData || [];

  const users =
    membersData?.map((m) => ({
      id: m.userId,
      name: m.user?.name || 'Unknown',
      email: m.user?.email || '',
      avatar: m.user?.avatar,
    })) || [];

  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        status: selectedTask.status,
        priority: selectedTask.priority,
        type: selectedTask.type || 'task',
        assigneeIds: selectedTask.assigneeIds || [],
        labelIds: selectedTask.labelIds || [],
        storyPoints: selectedTask.storyPoints,
        dueDate: isoToDate(selectedTask.dueDate),
      });
      setHasChanges(false);
    }
  }, [selectedTask]);

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

  useEffect(() => {
    if (isTaskModalOpen && selectedTask) {
      refetchComments();
    }
  }, [isTaskModalOpen, selectedTask, refetchComments]);

  if (!isTaskModalOpen || !selectedTask || !currentProject) return null;

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        data: {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          type: formData.type,
          assigneeIds: formData.assigneeIds,
          labelIds: formData.labelIds,
          storyPoints: formData.storyPoints,
          dueDate: dateToISO(formData.dueDate),
        },
      });

      setHasChanges(false);
      closeTaskModal();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;

    if (
      window.confirm('Are you sure you want to delete this task? This action cannot be undone.')
    ) {
      try {
        await deleteTaskMutation.mutateAsync(selectedTask.id);
        closeTaskModal();
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setFormData({
          title: selectedTask.title,
          description: selectedTask.description || '',
          status: selectedTask.status,
          priority: selectedTask.priority,
          type: selectedTask.type || 'task',
          assigneeIds: selectedTask.assigneeIds || [],
          labelIds: selectedTask.labelIds || [],
          storyPoints: selectedTask.storyPoints,
          dueDate: isoToDate(selectedTask.dueDate),
        });
        setHasChanges(false);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

    try {
      await addCommentMutation.mutateAsync({
        taskId: selectedTask.id,
        data: {
          content: newComment.trim(),
        },
      });
      setNewComment('');
      refetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteCommentMutation.mutateAsync(commentId);
        refetchComments();
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
      }
    }
  };

  const toggleAssignee = (userId: string) => {
    setFormData((prev) => {
      const newAssignees = prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...prev.assigneeIds, userId];
      return { ...prev, assigneeIds: newAssignees };
    });
    setHasChanges(true);
  };

  const typeConfig = TASK_TYPE_CONFIG[formData.type] || TASK_TYPE_CONFIG.task;
  const statusConfig = STATUS_COLUMNS.find((s) => s.id === formData.status);
  const isSaving = updateTaskMutation.isPending;
  const isDeleting = deleteTaskMutation.isPending;

  const formatActivityAction = (activity: ActivityResponse): string => {
    const actionMap: Record<string, string> = {
      created: 'created this task',
      commented: 'added a comment',
      status_changed: 'changed status',
      priority_changed: 'changed priority',
      assigned: 'assigned this task',
      started_timer: 'started time tracking',
      stopped_timer: 'stopped time tracking',
      logged_time: 'logged time',
      added_attachment: 'added an attachment',
      deleted_attachment: 'removed an attachment',
      created_checklist: 'created a checklist',
      added_dependency: 'added a dependency',
      removed_dependency: 'removed a dependency',
    };

    let text = actionMap[activity.action] || activity.action;

    if (activity.fieldName) {
      text += ` (${activity.fieldName})`;
    }
    if (activity.oldValue && activity.newValue) {
      text += `: ${activity.oldValue} → ${activity.newValue}`;
    } else if (activity.newValue) {
      text += `: ${activity.newValue}`;
    }

    return text;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/50">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm"
                style={{
                  backgroundColor: `${typeConfig.color}15`,
                  border: `2px solid ${typeConfig.color}40`,
                }}
              >
                <span className="text-xl" style={{ color: typeConfig.color }}>
                  {typeConfig.icon}
                </span>
              </div>
              <div>
                <span className="text-sm font-mono font-semibold text-gray-500 dark:text-gray-400">
                  {selectedTask.id.slice(0, 8)}
                </span>
                {hasChanges && (
                  <span className="ml-2 px-2.5 py-1 bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full border border-orange-200 dark:border-orange-900">
                    Unsaved
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50 border border-transparent hover:border-red-200 dark:hover:border-red-900"
                title="Delete task"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => {
                  if (hasChanges) {
                    if (
                      window.confirm('You have unsaved changes. Are you sure you want to close?')
                    ) {
                      closeTaskModal();
                    }
                  } else {
                    closeTaskModal();
                  }
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <X className="w-5 h-5" />
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
                className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 outline-none rounded-xl px-3 py-2 -mx-3 mb-4 transition-all"
                placeholder="Task title"
              />

              {/* Status bar */}
              <div className="flex flex-wrap gap-2 mb-6">
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value as TaskStatus)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border-2 cursor-pointer transition-all shadow-sm hover:shadow"
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

                <select
                  value={formData.priority}
                  onChange={(e) => updateField('priority', e.target.value as Priority)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value as TaskType)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
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
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Description
                </h3>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Add a detailed description..."
                  className="w-full min-h-[140px] p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Tabs */}
              <div className="mt-8 border-t-2 border-gray-100 dark:border-gray-800 pt-6">
                <div className="flex gap-1 border-b-2 border-gray-100 dark:border-gray-800 mb-6">
                  {(
                    [
                      {
                        id: 'comments',
                        label: 'Comments',
                        icon: MessageSquare,
                        count: comments.length,
                      },
                      {
                        id: 'activity',
                        label: 'Activity',
                        icon: Activity,
                        count: activities.length,
                      },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                          activeTab === tab.id
                            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count > 0 && (
                          <span
                            className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                              activeTab === tab.id
                                ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  {activeTab === 'comments' && (
                    <div>
                      <div className="flex gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-sm font-bold text-white">
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
                            placeholder="Write a comment... (⌘+Enter to send)"
                            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            rows={3}
                          />
                          {newComment.trim() && (
                            <button
                              onClick={handleAddComment}
                              disabled={addCommentMutation.isPending}
                              className="mt-3 flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm hover:shadow"
                            >
                              <Send className="w-4 h-4" />
                              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                            </button>
                          )}
                        </div>
                      </div>

                      {comments.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                          </div>
                          <p className="text-gray-400 dark:text-gray-600 font-medium">
                            No comments yet
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                            Start the conversation
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {comments.map((comment) => {
                            const user = users.find((u) => u.id === comment.userId);
                            return (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0 shadow">
                                  <span className="text-sm font-bold text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {user?.name || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatRelativeTime(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {comment.content}
                                  </p>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 mt-2 font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-3">
                      {activities.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Activity className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                          </div>
                          <p className="text-gray-400 dark:text-gray-600 font-medium">
                            No activity yet
                          </p>
                        </div>
                      ) : (
                        activities.map((activity) => {
                          const user = users.find((u) => u.id === activity.userId);
                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0 shadow">
                                <span className="text-xs font-bold text-white">
                                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {user?.name || 'System'}
                                  </span>{' '}
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {formatActivityAction(activity)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatRelativeTime(activity.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 border-l-2 border-gray-100 dark:border-gray-800 p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900 overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Task Details
              </h3>

              {/* Assignees */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assignees
                </label>
                <div className="space-y-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assigneeIds.includes(user.id)}
                        onChange={() => toggleAssignee(user.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow">
                        <span className="text-xs font-bold text-white">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                    </label>
                  ))}
                  {users.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">
                      No members available
                    </p>
                  )}
                </div>
              </div>

              {/* Story Points */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Story Points
                </label>
                <input
                  type="number"
                  value={formData.storyPoints || ''}
                  onChange={(e) =>
                    updateField('storyPoints', parseInt(e.target.value) || undefined)
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="Enter estimate"
                  min="0"
                />
              </div>

              {/* Due Date - FIXED FOR DARK MODE */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all
                    [&::-webkit-calendar-picker-indicator]:dark:invert
                    [&::-webkit-calendar-picker-indicator]:dark:opacity-70
                    [&::-webkit-calendar-picker-indicator]:hover:dark:opacity-100
                    [&::-webkit-datetime-edit-text]:dark:text-gray-400
                    [&::-webkit-datetime-edit-month-field]:dark:text-white
                    [&::-webkit-datetime-edit-day-field]:dark:text-white
                    [&::-webkit-datetime-edit-year-field]:dark:text-white"
                  />
                  {formData.dueDate && (
                    <button
                      onClick={() => updateField('dueDate', '')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                      title="Clear date"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Created/Updated */}
              <div className="pt-6 border-t-2 border-gray-100 dark:border-gray-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">
                      Created {formatRelativeTime(selectedTask.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">
                      Updated {formatRelativeTime(selectedTask.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-100 dark:border-gray-800 px-6 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/50 flex items-center justify-between">
            <div className="text-sm font-medium">
              {hasChanges && (
                <span className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || !formData.title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
