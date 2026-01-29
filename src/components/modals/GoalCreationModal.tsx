// src/components/goals/GoalCreationModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Target, Calendar, TrendingUp, Loader2, AlertCircle, Save } from 'lucide-react';
import { useCreateGoal } from '../../hooks/api/useGoals';
import { CustomCalendar } from '../common/Calender';
import { ConfirmModal } from '../modals/ConfirmModal';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/api';

interface GoalCreationModalProps {
  sprintId: string;
  workspaceId: string;
  projectId?: string;
  onClose: () => void;
}

export const GoalCreationModal: React.FC<GoalCreationModalProps> = ({
  sprintId,
  workspaceId,
  projectId,
  onClose,
}) => {
  const createGoalMutation = useCreateGoal();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalType: 'sprint',
    targetValue: '',
    currentValue: '0',
    unit: '',
    targetDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showTargetCalendar, setShowTargetCalendar] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const targetCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTargetCalendar) {
      setErrors({});
      setHasChanges(false);
    }
  }, [showTargetCalendar]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasChanges) {
          setShowConfirmModal(true);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, hasChanges]);

  // Click outside calendar handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (targetCalendarRef.current && !targetCalendarRef.current.contains(e.target as Node)) {
        setShowTargetCalendar(false);
      }
    };

    if (showTargetCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTargetCalendar]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Goal title is required';
    if (formData.targetValue && parseFloat(formData.targetValue) <= 0) {
      newErrors.targetValue = 'Target value must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createGoalMutation.mutateAsync({
        workspaceId,
        projectId,
        sprintId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        goalType: formData.goalType,
        targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
        unit: formData.unit || undefined,
        targetDate: formData.targetDate || undefined,
      });
      toast.success('Goal created successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to create goal:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select target date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={() => {
          if (hasChanges) {
            setShowConfirmModal(true);
          } else {
            onClose();
          }
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Create Sprint Goal
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set objectives and key results
                </p>
              </div>
              {hasChanges && (
                <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved
                </span>
              )}
            </div>
            <button
              onClick={() => {
                if (hasChanges) {
                  setShowConfirmModal(true);
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Goal Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Goal Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.title
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-400`}
                placeholder="e.g., Complete all planned features, Improve velocity by 20%"
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the goal and expected outcomes..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Target Value & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Target Value <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => updateField('targetValue', e.target.value)}
                  placeholder="100"
                  step="0.01"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.targetValue
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-400`}
                />
                {errors.targetValue && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.targetValue}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Unit <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => updateField('unit', e.target.value)}
                  placeholder="story points, tasks, %"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Target Date */}
            <div ref={targetCalendarRef} className="relative">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4" />
                Target Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTargetCalendar(!showTargetCalendar)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-left transition-all flex items-center justify-between group"
              >
                <span
                  className={
                    formData.targetDate
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-400'
                  }
                >
                  {formatDateDisplay(formData.targetDate)}
                </span>
                <Calendar
                  className={`w-4 h-4 ${
                    formData.targetDate ? 'text-purple-500' : 'text-gray-400'
                  } group-hover:text-purple-500 transition-colors`}
                />
              </button>
              {showTargetCalendar && (
                <CustomCalendar
                  selectedDate={formData.targetDate}
                  onSelect={(date) => {
                    updateField('targetDate', date);
                    setShowTargetCalendar(false);
                  }}
                  onClose={() => setShowTargetCalendar(false)}
                />
              )}
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                💡 <strong>Tip:</strong> You can add key results and link tasks to this goal after
                creation.
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={createGoalMutation.isPending}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createGoalMutation.isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {createGoalMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Goal
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={() => {
          setShowConfirmModal(false);
          onClose();
        }}
        onCancel={() => setShowConfirmModal(false)}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close?"
        confirmText="Close Anyway"
        variant="warning"
      />
    </>
  );
};
