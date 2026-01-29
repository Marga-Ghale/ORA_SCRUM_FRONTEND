/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/tasks/TaskDetailModal.tsx - FIXED VERSION
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { ConfirmModal } from '../modals/ConfirmModal';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/api';
import { SprintSelector } from '../sprint/SprintSelector';

const TaskDetailModal: React.FC = () => {
  const { selectedTask, isTaskModalOpen, closeTaskModal } = useProjectContext();

  // Use task's projectId instead of currentProject
  const projectId = selectedTask?.projectId || '';

  const { data: commentsData, refetch: refetchComments } = useTaskComments(selectedTask?.id || '', {
    enabled: !!selectedTask?.id,
  });

  const { data: activityData } = useTaskActivity(selectedTask?.id || '', 50, {
    enabled: !!selectedTask?.id,
  });

  // Use task's projectId for fetching members
  const { data: membersData } = useEffectiveMembers('project', projectId, {
    enabled: !!projectId,
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
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [newComment, setNewComment] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const comments: CommentResponse[] = commentsData || [];
  const activities: ActivityResponse[] = activityData || [];

  const users = useMemo(() => {
    if (!membersData) return [];
    // Filter out workspace-inherited members (they only have visibility, not content access)
    return membersData
      .filter((member: any) => !(member.isInherited && member.inheritedFrom === 'workspace'))
      .map((member: any) => ({
        id: member.userId,
        name: member.user?.name || 'Unknown',
        email: member.user?.email || '',
        avatar: member.user?.avatar,
      }));
  }, [membersData]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

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
          setShowConfirmModal(true);
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

  // FIXED: Remove currentProject check - use task's projectId instead
  if (!isTaskModalOpen || !selectedTask) return null;

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
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    setShowDeleteTaskModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      await deleteTaskMutation.mutateAsync(selectedTask.id);
      setShowDeleteTaskModal(false);
      closeTaskModal();
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmModal(true);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!selectedTask || !commentToDelete) return;

    try {
      await deleteCommentMutation.mutateAsync(commentToDelete);
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
      refetchComments();
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(getErrorMessage(error));
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
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error(getErrorMessage(error));
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

  const handleSprintChange = async (sprintId: string | null) => {
    if (!selectedTask) return;
    try {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        data: { sprintId: sprintId || undefined },
      });
      toast.success(sprintId ? 'Added to sprint' : 'Removed from sprint');
    } catch (error) {
      toast.error('Failed to update sprint');
    }
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={() => {
          if (hasChanges) {
            setShowConfirmModal(true);
          } else {
            closeTaskModal();
          }
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${typeConfig.color}15` }}
              >
                <span className="text-lg" style={{ color: typeConfig.color }}>
                  {typeConfig.icon}
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {selectedTask.id.slice(0, 8).toUpperCase()}
              </span>
              {hasChanges && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete task"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  if (hasChanges) {
                    setShowConfirmModal(true);
                  } else {
                    closeTaskModal();
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              {/* Title */}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 outline-none rounded-lg px-3 py-2 -mx-3 mb-4 transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
                placeholder="Task title"
              />

              {/* Status Pills */}
              <div className="flex flex-wrap gap-2 mb-5">
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
              <div className="mb-5">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Add a description..."
                  className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Mobile Details */}
              <div className="lg:hidden mb-5 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                {/* Assignees */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <User className="w-3.5 h-3.5" />
                    Assignees
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
                        No members available
                      </p>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assigneeIds.includes(user.id)}
                            onChange={() => toggleAssignee(user.id)}
                            className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500"
                          />
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {user.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div ref={calendarRef} className="relative">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Due Date
                  </label>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left text-sm flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    {formData.dueDate && dueDateInfo ? (
                      <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">Set due date</span>
                    )}
                    {formData.dueDate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateField('dueDate', '');
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </button>
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
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <Target className="w-3.5 h-3.5" />
                    Story Points
                  </label>
                  <input
                    type="number"
                    value={formData.storyPoints || ''}
                    onChange={(e) =>
                      updateField('storyPoints', parseInt(e.target.value) || undefined)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {[
                    {
                      id: 'comments' as const,
                      label: 'Comments',
                      icon: MessageSquare,
                      count: comments.length,
                    },
                    {
                      id: 'activity' as const,
                      label: 'Activity',
                      icon: Activity,
                      count: activities.length,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.count > 0 && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                              activeTab === tab.id
                                ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pb-16 lg:pb-0">
                  {activeTab === 'comments' && (
                    <div>
                      {/* Add Comment */}
                      <div className="flex gap-3 mb-4">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">
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
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400"
                            rows={2}
                          />
                          {newComment.trim() && (
                            <button
                              onClick={handleAddComment}
                              disabled={addCommentMutation.isPending}
                              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {addCommentMutation.isPending ? 'Posting...' : 'Post'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Comments List */}
                      {comments.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No comments yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {comments.map((comment) => {
                            const user = users.find((u) => u.id === comment.userId);
                            return (
                              <div key={comment.id} className="flex gap-2.5 group">
                                <div className="w-7 h-7 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[10px] font-bold text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                                        {user?.name || 'Unknown'}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        {formatRelativeTime(comment.createdAt)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 hover:text-red-500 transition-all"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
                    <div className="space-y-1">
                      {activities.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No activity yet
                          </p>
                        </div>
                      ) : (
                        activities.map((activity) => {
                          const user = users.find((u) => u.id === activity.userId);
                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-2.5 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-white">
                                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {user?.name || 'System'}
                                  </span>{' '}
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {formatActivityAction(activity)}
                                  </span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatRelativeTime(activity.createdAt)}
                                </p>
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

            {/* Right Sidebar - Desktop Only */}
            <div className="hidden lg:block w-72 border-l border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-5">
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Details
                </h3>

                {/* Assignees */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    <User className="w-3.5 h-3.5" />
                    Assignees
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {users.length === 0 ? (
                      <div className="text-center py-4 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        <User className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">No members</p>
                      </div>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assigneeIds.includes(user.id)}
                            onChange={() => toggleAssignee(user.id)}
                            className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500"
                          />
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-white">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block truncate">
                              {user.name}
                            </span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div ref={calendarRef} className="relative">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Due Date
                  </label>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left text-sm flex items-center justify-between group hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center ${
                          formData.dueDate
                            ? 'bg-brand-50 dark:bg-brand-900/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <Calendar
                          className={`w-3.5 h-3.5 ${
                            formData.dueDate ? 'text-brand-500' : 'text-gray-400'
                          }`}
                        />
                      </div>
                      {formData.dueDate && dueDateInfo ? (
                        <div>
                          <p className={`text-xs font-medium ${dueDateInfo.color}`}>
                            {dueDateInfo.text}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(formData.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Set date</span>
                      )}
                    </div>
                    {formData.dueDate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateField('dueDate', '');
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </button>
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
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    <Target className="w-3.5 h-3.5" />
                    Story Points
                  </label>
                  <input
                    type="number"
                    value={formData.storyPoints || ''}
                    onChange={(e) =>
                      updateField('storyPoints', parseInt(e.target.value) || undefined)
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Sprint
                  </label>
                  <SprintSelector
                    projectId={selectedTask.projectId}
                    selectedSprintId={selectedTask.sprintId}
                    onSelect={handleSprintChange}
                  />
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Created
                    </span>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {formatRelativeTime(selectedTask.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Updated
                    </span>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {formatRelativeTime(selectedTask.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <div className="text-xs">
              {hasChanges && (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || !formData.title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Modals */}
          <ConfirmModal
            isOpen={showConfirmModal}
            onConfirm={() => {
              setShowConfirmModal(false);
              closeTaskModal();
            }}
            onCancel={() => setShowConfirmModal(false)}
            title="Unsaved Changes"
            message="You have unsaved changes. Are you sure you want to close?"
            confirmText="Close Anyway"
            variant="warning"
          />

          <ConfirmModal
            isOpen={showDeleteTaskModal}
            onConfirm={confirmDeleteTask}
            onCancel={() => setShowDeleteTaskModal(false)}
            title="Delete Task"
            message="Are you sure you want to delete this task? This action cannot be undone."
            confirmText="Delete"
            variant="danger"
          />

          <ConfirmModal
            isOpen={showDeleteCommentModal}
            onConfirm={confirmDeleteComment}
            onCancel={() => {
              setShowDeleteCommentModal(false);
              setCommentToDelete(null);
            }}
            title="Delete Comment"
            message="Are you sure you want to delete this comment?"
            confirmText="Delete"
            variant="danger"
          />
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
