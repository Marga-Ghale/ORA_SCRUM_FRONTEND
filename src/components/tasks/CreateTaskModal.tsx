/* eslint-disable react-hooks/exhaustive-deps */
// src/components/CreateTaskModal/CreateTaskModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { TaskStatus, Priority, TaskType } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { useCreateTask } from '../../hooks/api/useTasks';
import { useEffectiveMembers } from '../../hooks/api/useMembers';
import { dateToISO } from '../../utils/dateUtils';

import { X, Save, Calendar, User, Target, MessageSquare } from 'lucide-react';

import { CustomCalendar } from '../common/Calender';
import { StatusDropdown } from './StatusDropdown';
import { PriorityDropdown } from './PriorityDropdown';
import { TypeDropdown } from './TypeDropdown';
import { SubtaskFormData } from '../Subtasks/SubtasksItems';
import { SubtasksSection } from '../Subtasks/SubtasksSection';

// ============================================
// CREATE TASK MODAL - MAIN COMPONENT
// ============================================

const CreateTaskModal: React.FC = () => {
  const { isCreateTaskModalOpen, currentProject, setIsCreateTaskModalOpen } = useProject();

  const createTaskMutation = useCreateTask();

  const [hasChanges, setHasChanges] = useState(false);

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

  const [subtasks, setSubtasks] = useState<SubtaskFormData[]>([]);

  const { data: membersData } = useEffectiveMembers('project', currentProject?.id || '', {
    enabled: !!currentProject?.id,
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [showCalendar, setShowCalendar] = useState(false);

  const isCreating = createTaskMutation.isPending;

  const users =
    membersData?.map((m) => ({
      id: m.userId,
      name: m.user?.name || 'Unknown',
      email: m.user?.email || '',
    })) || [];

  // Reset form when modal opens
  useEffect(() => {
    if (isCreateTaskModalOpen) {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        type: 'task',
        assigneeIds: [],
        labelIds: [],
        storyPoints: undefined,
        dueDate: '',
      });
      setSubtasks([]);
      setHasChanges(false);
    }
  }, [isCreateTaskModalOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasChanges) {
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            setIsCreateTaskModalOpen(false);
          }
        } else {
          setIsCreateTaskModalOpen(false);
        }
      }
    };

    if (isCreateTaskModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isCreateTaskModalOpen, setIsCreateTaskModalOpen, hasChanges]);

  // Click outside calendar
  useEffect(() => {
    if (!showCalendar) return;

    const onClick = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showCalendar]);

  if (!isCreateTaskModalOpen || !currentProject) return null;

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setHasChanges(true);
  };

  const toggleAssignee = (id: string) => {
    updateField(
      'assigneeIds',
      formData.assigneeIds.includes(id)
        ? formData.assigneeIds.filter((x) => x !== id)
        : [...formData.assigneeIds, id]
    );
  };

  const handleAddSubtask = (title: string) => {
    const newSubtask: SubtaskFormData = {
      id: `temp-${Date.now()}`,
      title,
      status: 'todo',
      priority: 'medium',
      assigneeIds: [],
    };
    setSubtasks([...subtasks, newSubtask]);
    setHasChanges(true);
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
    setHasChanges(true);
  };

  const handleUpdateSubtask = (id: string, updates: Partial<SubtaskFormData>) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setFormData({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          type: 'task',
          assigneeIds: [],
          labelIds: [],
          storyPoints: undefined,
          dueDate: '',
        });
        setSubtasks([]);
        setHasChanges(false);
      }
    } else {
      setIsCreateTaskModalOpen(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      // Create main task
      const taskData = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        type: formData.type,
        assigneeIds: formData.assigneeIds,
        storyPoints: formData.storyPoints,
        dueDate: formData.dueDate ? dateToISO(formData.dueDate) : undefined,
        // ✅ ADD THIS LINE
        subtasks: subtasks
          .filter((s) => s.title.trim())
          .map((s) => ({
            title: s.title,
            description: s.description,
            status: s.status,
            priority: s.priority,
            assigneeIds: s.assigneeIds,
            storyPoints: s.storyPoints,
            estimatedHours: s.estimatedHours,
          })),
      };

      await createTaskMutation.mutateAsync({
        projectId: currentProject.id,
        data: taskData,
      });

      setIsCreateTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };
  const typeConfig = {
    epic: { color: '#8B5CF6', icon: '⚡' },
    story: { color: '#10B981', icon: '📖' },
    task: { color: '#3B82F6', icon: '✓' },
    bug: { color: '#EF4444', icon: '🐛' },
    subtask: { color: '#6B7280', icon: '◻' },
  }[formData.type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={() => {
          if (!hasChanges || window.confirm('Discard changes?')) {
            setIsCreateTaskModalOpen(false);
          }
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/30">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm"
                style={{ backgroundColor: `${typeConfig.color}20` }}
              >
                <span className="text-2xl">{typeConfig.icon}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Task</h2>
              {hasChanges && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved
                </span>
              )}
            </div>

            <button
              onClick={() => setIsCreateTaskModalOpen(false)}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* MAIN */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Title */}
              <input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Task title"
                className="w-full text-3xl font-bold bg-transparent border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-brand-500 rounded-xl px-4 py-3 -mx-4 mb-5 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />

              {/* Meta */}
              <div className="flex gap-2 mb-8">
                <StatusDropdown
                  value={formData.status}
                  onChange={(v) => updateField('status', v)}
                />
                <PriorityDropdown
                  value={formData.priority}
                  onChange={(v) => updateField('priority', v)}
                />
                <TypeDropdown value={formData.type} onChange={(v) => updateField('type', v)} />
              </div>

              {/* Description */}
              <div className="mb-8">
                <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <MessageSquare className="w-4 h-4" /> Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full min-h-[150px] p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Describe the task..."
                />
              </div>

              {/* Subtasks Section */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                <SubtasksSection
                  subtasks={subtasks}
                  users={users as any}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onUpdateSubtask={handleUpdateSubtask}
                />
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="w-96 border-l border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <Target className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Task Details
                  </h3>
                </div>

                {/* Assignees */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" /> Assignees
                  </label>
                  <div className="space-y-2">
                    {users.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-all border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.assigneeIds.includes(u.id)}
                          onChange={() => toggleAssignee(u.id)}
                          className="w-4 h-4 rounded"
                        />
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-white">
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-xs text-gray-500 truncate">{u.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Due Date */}
                <div ref={calendarRef}>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    <Calendar className="w-4 h-4" /> Due Date
                  </label>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-all bg-white dark:bg-gray-800"
                  >
                    {formData.dueDate || 'Set due date'}
                  </button>

                  {showCalendar && (
                    <CustomCalendar
                      selectedDate={formData.dueDate}
                      onSelect={(d) => {
                        updateField('dueDate', d);
                        setShowCalendar(false);
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>

                {/* Story Points */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    <Target className="w-4 h-4" /> Story Points
                  </label>
                  <input
                    type="number"
                    value={formData.storyPoints || ''}
                    onChange={(e) =>
                      updateField('storyPoints', parseInt(e.target.value) || undefined)
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    placeholder="Enter points"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-5 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isCreating}
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || !formData.title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateTaskModal;
