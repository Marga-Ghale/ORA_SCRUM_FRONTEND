import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Target, Loader2, AlertCircle, Save, Clock } from 'lucide-react';
import { useCreateSprint } from '../../hooks/api/useSprints';
import { CustomCalendar } from '../common/Calender';
import { ConfirmModal } from '../modals/ConfirmModal';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/api';

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const createSprintMutation = useCreateSprint();
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);

      setFormData({
        name: `Sprint ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        goal: '',
        startDate: today.toISOString().split('T')[0],
        endDate: twoWeeksLater.toISOString().split('T')[0],
      });
      setErrors({});
      setHasChanges(false);
    }
  }, [isOpen]);

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

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, hasChanges]);

  // Click outside calendar handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (startCalendarRef.current && !startCalendarRef.current.contains(e.target as Node)) {
        setShowStartCalendar(false);
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(e.target as Node)) {
        setShowEndCalendar(false);
      }
    };

    if (showStartCalendar || showEndCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStartCalendar, showEndCalendar]);

  if (!isOpen) return null;

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear error for this field
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
    if (!formData.name.trim()) newErrors.name = 'Sprint name is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.endDate) <= new Date(formData.startDate)
    ) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createSprintMutation.mutateAsync({
        projectId,
        data: {
          name: formData.name.trim(),
          goal: formData.goal.trim() || undefined,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        },
      });
      onClose();
      toast.success('Sprint created successfully');
    } catch (error) {
      console.error('Failed to create sprint:', error);
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

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return null;
    const days = Math.ceil(
      (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (weeks > 0 && remainingDays > 0) return `${weeks}w ${remainingDays}d`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select date';
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
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Sprint</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{projectName}</p>
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
            {/* Sprint Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sprint Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.name
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 dark:border-gray-700 focus:border-brand-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400`}
                placeholder="e.g., Sprint 1, Q1 Sprint, Feature Development"
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Sprint Goal */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Target className="w-4 h-4" />
                Sprint Goal <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.goal}
                onChange={(e) => updateField('goal', e.target.value)}
                placeholder="What do you want to achieve in this sprint?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div ref={startCalendarRef} className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Start Date <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowStartCalendar(!showStartCalendar);
                    setShowEndCalendar(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.startDate
                      ? 'border-red-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } bg-white dark:bg-gray-800 text-left transition-all flex items-center justify-between group`}
                >
                  <span
                    className={
                      formData.startDate
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-400'
                    }
                  >
                    {formatDateDisplay(formData.startDate)}
                  </span>
                  <Calendar
                    className={`w-4 h-4 ${
                      formData.startDate ? 'text-brand-500' : 'text-gray-400'
                    } group-hover:text-brand-500 transition-colors`}
                  />
                </button>
                {errors.startDate && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.startDate}
                  </p>
                )}
                {showStartCalendar && (
                  <CustomCalendar
                    selectedDate={formData.startDate}
                    onSelect={(date) => {
                      updateField('startDate', date);
                      setShowStartCalendar(false);
                    }}
                    onClose={() => setShowStartCalendar(false)}
                  />
                )}
              </div>

              {/* End Date */}
              <div ref={endCalendarRef} className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  End Date <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowEndCalendar(!showEndCalendar);
                    setShowStartCalendar(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.endDate
                      ? 'border-red-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } bg-white dark:bg-gray-800 text-left transition-all flex items-center justify-between group`}
                >
                  <span
                    className={
                      formData.endDate
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-400'
                    }
                  >
                    {formatDateDisplay(formData.endDate)}
                  </span>
                  <Calendar
                    className={`w-4 h-4 ${
                      formData.endDate ? 'text-brand-500' : 'text-gray-400'
                    } group-hover:text-brand-500 transition-colors`}
                  />
                </button>
                {errors.endDate && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.endDate}
                  </p>
                )}
                {showEndCalendar && (
                  <CustomCalendar
                    selectedDate={formData.endDate}
                    onSelect={(date) => {
                      updateField('endDate', date);
                      setShowEndCalendar(false);
                    }}
                    onClose={() => setShowEndCalendar(false)}
                  />
                )}
              </div>
            </div>

            {/* Duration Display */}
            {calculateDuration() && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
                      Sprint Duration
                    </p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {calculateDuration()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={createSprintMutation.isPending}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createSprintMutation.isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {createSprintMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Sprint
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

export default CreateSprintModal;
