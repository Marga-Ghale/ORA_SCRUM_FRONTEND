import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  TaskStatus,
  Priority,
  TaskType,
  STATUS_COLUMNS,
  PRIORITY_CONFIG,
  TASK_TYPE_CONFIG,
} from '../../types/project';

import { useProject } from '../../context/ProjectContext';
import { useCreateTask, CreateTaskRequest } from '../../hooks/api/useTasks';
import { useEffectiveMembers } from '../../hooks/api/useMembers';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: TaskStatus;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  initialStatus = 'todo',
}) => {
  const { currentProject } = useProject();
  const createTask = useCreateTask();

  // ===============================
  // Members (Assignees)
  // ===============================
  const { data: membersResponse } = useEffectiveMembers('project', currentProject?.id || '', {
    enabled: !!currentProject?.id,
  });

  const users = membersResponse?.map((m) => m.user).filter(Boolean) ?? [];

  // ===============================
  // Form State
  // ===============================
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<Priority>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [assigneeId, setAssigneeId] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  // ===============================
  // Effects
  // ===============================
  useEffect(() => {
    if (!isOpen) return;

    setTitle('');
    setDescription('');
    setStatus(initialStatus);
    setPriority('medium');
    setType('task');
    setAssigneeId('');
    setStoryPoints('');
    setDueDate(null);
    setError('');

    setTimeout(() => titleRef.current?.focus(), 100);
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialStatus]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  // ===============================
  // Submit
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!currentProject?.id) {
      setError('Project not selected');
      return;
    }

    const payload: CreateTaskRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      status: status.toUpperCase(),
      priority: priority.toUpperCase(),
      type: type.toUpperCase(),
      assigneeIds: assigneeId ? [assigneeId] : undefined,
      storyPoints: storyPoints ? Number(storyPoints) : undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    };

    try {
      await createTask.mutateAsync({
        projectId: currentProject.id,
        data: payload,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  if (!isOpen) return null;

  // ===============================
  // Date Picker Button (Styled)
  // ===============================
  const CustomDateInput = React.forwardRef<
    HTMLButtonElement,
    { value?: string; onClick?: () => void }
  >(({ value, onClick }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="w-full px-3 py-2.5 text-sm text-left rounded-xl
        bg-gray-50 dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-gray-100
        hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {value || 'Select due date'}
    </button>
  ));
  CustomDateInput.displayName = 'CustomDateInput';

  // ===============================
  // UI
  // ===============================
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl shadow-xl
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-4 py-3 rounded-xl
              bg-gray-50 dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full px-4 py-3 rounded-xl min-h-[100px]
              bg-gray-50 dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="grid grid-cols-3 gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className="input"
            >
              {Object.keys(TASK_TYPE_CONFIG).map((k) => (
                <option key={k} value={k}>
                  {TASK_TYPE_CONFIG[k as TaskType].name}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="input"
            >
              {STATUS_COLUMNS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="input"
            >
              {Object.keys(PRIORITY_CONFIG).map((k) => (
                <option key={k} value={k}>
                  {PRIORITY_CONFIG[k as Priority].name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="input"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u!.id} value={u!.id}>
                {u!.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
            placeholder="Story points"
            className="input"
          />

          <DatePicker selected={dueDate} onChange={setDueDate} customInput={<CustomDateInput />} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={createTask.isPending}
            className="px-6 py-2 rounded-xl font-medium
              bg-brand-600 hover:bg-brand-700
              text-white disabled:opacity-60"
          >
            {createTask.isPending ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default CreateTaskModal;
