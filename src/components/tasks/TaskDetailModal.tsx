// src/components/TaskDetailModal/TaskDetailModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, Priority, TaskType, TASK_TYPE_CONFIG } from '../../types/project';
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
import { CustomCalendar } from '../common/Calender';
import { StatusDropdown } from './StatusDropdown';
import { PriorityDropdown } from './PriorityDropdown';
import { TypeDropdown } from './TypeDropdown';
import { useProjectContext } from '../../context/ProjectContext';

const TaskDetailModal: React.FC = () => {
  const { selectedTask, isTaskModalOpen, closeTaskModal, currentProject } = useProjectContext();

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
  const [showCalendar, setShowCalendar] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

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

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isPast = date < today && !isToday;

    if (isToday) return { text: 'Today', color: 'text-orange-600 dark:text-orange-400' };
    if (isTomorrow) return { text: 'Tomorrow', color: 'text-blue-600 dark:text-blue-400' };
    if (isPast)
      return {
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        color: 'text-red-600 dark:text-red-400',
      };

    return {
      text: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      }),
      color: 'text-gray-600 dark:text-gray-400',
    };
  };

  const dueDateInfo = formatDueDate(formData.dueDate);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in duration-200"
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
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-200/50 dark:border-gray-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/30">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                style={{
                  backgroundColor: `${typeConfig.color}12`,
                }}
              >
                <span className="text-2xl" style={{ color: typeConfig.color }}>
                  {typeConfig.icon}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                  {selectedTask.id.slice(0, 8).toUpperCase()}
                </span>
                {hasChanges && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-900/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50 group"
                title="Delete task"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all group"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
              {/* Title */}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 outline-none rounded-xl px-4 py-3 -mx-4 mb-5 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                placeholder="Task title"
              />

              {/* Professional Metadata Pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                <StatusDropdown
                  value={formData.status}
                  onChange={(value) => updateField('status', value)}
                />
                <PriorityDropdown
                  value={formData.priority}
                  onChange={(value) => updateField('priority', value)}
                />
                <TypeDropdown
                  value={formData.type}
                  onChange={(value) => updateField('type', value)}
                />
              </div>

              {/* Description */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Description
                  </h3>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Add a detailed description of this task..."
                  className="w-full min-h-[160px] p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed"
                />
              </div>

              {/* Tabs */}
              <div className="border-t-2 border-gray-100 dark:border-gray-800 pt-8">
                <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/50 p-1.5 rounded-xl inline-flex">
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
                        className={`flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                          activeTab === tab.id
                            ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count > 0 && (
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              activeTab === tab.id
                                ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  {activeTab === 'comments' && (
                    <div>
                      <div className="flex gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white dark:ring-gray-900">
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
                            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            rows={3}
                          />
                          {newComment.trim() && (
                            <button
                              onClick={handleAddComment}
                              disabled={addCommentMutation.isPending}
                              className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                            >
                              <Send className="w-4 h-4" />
                              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                            </button>
                          )}
                        </div>
                      </div>

                      {comments.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                            <MessageSquare className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg mb-1">
                            No comments yet
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Start the conversation and share your thoughts
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {comments.map((comment) => {
                            const user = users.find((u) => u.id === comment.userId);
                            return (
                              <div key={comment.id} className="flex gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white dark:ring-gray-900">
                                  <span className="text-sm font-bold text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-gray-800/70 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.name || 'Unknown User'}
                                      </span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {formatRelativeTime(comment.createdAt)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-all"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-2">
                      {activities.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                            <Activity className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg mb-1">
                            No activity yet
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Activity will appear here as changes are made
                          </p>
                        </div>
                      ) : (
                        activities.map((activity) => {
                          const user = users.find((u) => u.id === activity.userId);
                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-gray-900">
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
            <div className="w-96 border-l border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <Target className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Task Details
                  </h3>
                </div>

                {/* Assignees */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    Assignees
                  </label>
                  <div className="space-y-2 mt-3">
                    {users.length === 0 ? (
                      <div className="text-center py-8 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <User className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          No members available
                        </p>
                      </div>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-all border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 group"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assigneeIds.includes(user.id)}
                            onChange={() => toggleAssignee(user.id)}
                            className="w-4 h-4 rounded-md border-2 border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all"
                          />
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow ring-2 ring-white dark:ring-gray-900">
                            <span className="text-xs font-bold text-white">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                              {user.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                              {user.email}
                            </span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Due Date with Custom Calendar */}
                <div ref={calendarRef} className="relative">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    Due Date
                  </label>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`w-full mt-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between group ${
                      formData.dueDate
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.dueDate
                            ? 'bg-brand-50 dark:bg-brand-950/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <Calendar
                          className={`w-5 h-5 ${
                            formData.dueDate
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        {formData.dueDate && dueDateInfo ? (
                          <>
                            <div className={`text-sm font-semibold ${dueDateInfo.color}`}>
                              {dueDateInfo.text}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(formData.dueDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Set due date
                          </div>
                        )}
                      </div>
                    </div>
                    {formData.dueDate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateField('dueDate', '');
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </button>

                  {/* Custom Calendar Dropdown - Opens UPWARD */}
                  {showCalendar && (
                    <CustomCalendar
                      selectedDate={formData.dueDate}
                      onSelect={(date) => updateField('dueDate', date)}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>

                {/* Story Points */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    Story Points
                  </label>
                  <input
                    type="number"
                    value={formData.storyPoints || ''}
                    onChange={(e) =>
                      updateField('storyPoints', parseInt(e.target.value) || undefined)
                    }
                    className="w-full mt-3 px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter points"
                    min="0"
                  />
                </div>

                {/* Metadata */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Created
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatRelativeTime(selectedTask.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Updated
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatRelativeTime(selectedTask.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-5 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/30 flex items-center justify-between">
            <div className="text-sm font-medium">
              {hasChanges && (
                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || !formData.title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
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
