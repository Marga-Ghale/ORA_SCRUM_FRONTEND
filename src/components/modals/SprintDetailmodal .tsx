import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Trash2,
  Calendar,
  Target,
  Clock,
  Activity,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Sprint,
  useUpdateSprint,
  useDeleteSprint,
  useStartSprint,
  useCompleteSprint,
} from '../../hooks/api/useSprints';
import { CustomCalendar } from '../common/Calender';
import { ConfirmModal } from './ConfirmModal';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/api';
import { formatRelativeTime } from '../../utils/dateUtils';

interface SprintDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint | null;
}

const SprintDetailModal: React.FC<SprintDetailModalProps> = ({ isOpen, onClose, sprint }) => {
  const updateSprintMutation = useUpdateSprint();
  const deleteSprintMutation = useDeleteSprint();
  const startSprintMutation = useStartSprint();
  const completeSprintMutation = useCompleteSprint();

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStartSprintModal, setShowStartSprintModal] = useState(false);
  const [showCompleteSprintModal, setShowCompleteSprintModal] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);

  // Initialize form data when sprint changes
  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name,
        goal: sprint.goal || '',
        startDate: new Date(sprint.startDate).toISOString().split('T')[0],
        endDate: new Date(sprint.endDate).toISOString().split('T')[0],
      });
      setHasChanges(false);
      setErrors({});
    }
  }, [sprint]);

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

  if (!isOpen || !sprint) return null;

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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await updateSprintMutation.mutateAsync({
        sprintId: sprint.id,
        data: {
          name: formData.name.trim(),
          goal: formData.goal.trim() || undefined,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        },
      });
      setHasChanges(false);
      toast.success('Sprint updated successfully');
    } catch (error) {
      console.error('Failed to update sprint:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSprintMutation.mutateAsync(sprint.id);
      setShowDeleteModal(false);
      onClose();
      toast.success('Sprint deleted successfully');
    } catch (error) {
      console.error('Failed to delete sprint:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleStartSprint = async () => {
    try {
      await startSprintMutation.mutateAsync(sprint.id);
      setShowStartSprintModal(false);
      toast.success('Sprint started successfully');
    } catch (error) {
      console.error('Failed to start sprint:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleCompleteSprint = async () => {
    try {
      await completeSprintMutation.mutateAsync(sprint.id);
      setShowCompleteSprintModal(false);
      toast.success('Sprint completed successfully');
    } catch (error) {
      console.error('Failed to complete sprint:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmModal(true);
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

  const calculateProgress = () => {
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return Math.round(percentage);
  };

  const getDaysRemaining = () => {
    const end = new Date(sprint.endDate).getTime();
    const now = Date.now();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return days;
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

  const getStatusConfig = () => {
    switch (sprint.status) {
      case 'planning':
        return {
          label: 'Planning',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          icon: Target,
        };
      case 'active':
        return {
          label: 'Active',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-950/30',
          icon: PlayCircle,
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-950/30',
          icon: CheckCircle2,
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          icon: Target,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const progress = sprint.status === 'active' ? calculateProgress() : 0;
  const daysRemaining = getDaysRemaining();

  const isSaving = updateSprintMutation.isPending;
  const isDeleting = deleteSprintMutation.isPending;
  const isStarting = startSprintMutation.isPending;
  const isCompleting = completeSprintMutation.isPending;

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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${statusConfig.bgColor} shadow-sm flex-shrink-0`}
              >
                <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    Sprint Details
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {sprint.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              {hasChanges && (
                <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete sprint"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  if (hasChanges) {
                    setShowConfirmModal(true);
                  } else {
                    onClose();
                  }
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Progress Bar (Active sprints only) */}
              {sprint.status === 'active' && (
                <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/30 dark:to-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span className="text-sm font-semibold text-brand-900 dark:text-brand-300">
                        Sprint Progress
                      </span>
                    </div>
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-brand-200 dark:bg-brand-900/30 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-700 dark:text-brand-400">
                      {daysRemaining > 0
                        ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                        : 'Sprint ended'}
                    </span>
                    <span className="text-brand-600 dark:text-brand-500">
                      {formatDateDisplay(formData.startDate)} -{' '}
                      {formatDateDisplay(formData.endDate)}
                    </span>
                  </div>
                </div>
              )}

              {/* Sprint Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Sprint Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  disabled={sprint.status === 'completed'}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 dark:border-gray-700 focus:border-brand-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed`}
                  placeholder="Sprint name"
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
                  disabled={sprint.status === 'completed'}
                  placeholder="What do you want to achieve in this sprint?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none transition-all placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      if (sprint.status !== 'completed') {
                        setShowStartCalendar(!showStartCalendar);
                        setShowEndCalendar(false);
                      }
                    }}
                    disabled={sprint.status === 'completed'}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.startDate
                        ? 'border-red-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } bg-white dark:bg-gray-800 text-left transition-all flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed`}
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
                      if (sprint.status !== 'completed') {
                        setShowEndCalendar(!showEndCalendar);
                        setShowStartCalendar(false);
                      }
                    }}
                    disabled={sprint.status === 'completed'}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.endDate
                        ? 'border-red-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } bg-white dark:bg-gray-800 text-left transition-all flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed`}
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

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Created
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatRelativeTime(sprint.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Updated
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatRelativeTime(sprint.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {sprint.status === 'planning' && (
                  <button
                    onClick={() => setShowStartSprintModal(true)}
                    disabled={isStarting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Start Sprint
                      </>
                    )}
                  </button>
                )}
                {sprint.status === 'active' && (
                  <button
                    onClick={() => setShowCompleteSprintModal(true)}
                    disabled={isCompleting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Sprint
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={handleCancel}
                  disabled={!hasChanges || isSaving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-gray-200 dark:border-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving || sprint.status === 'completed'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
      </div>

      {/* Confirm Modals */}
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        title="Delete Sprint"
        message="Are you sure you want to delete this sprint? This action cannot be undone."
        confirmText="Delete Sprint"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showStartSprintModal}
        onConfirm={handleStartSprint}
        onCancel={() => setShowStartSprintModal(false)}
        title="Start Sprint"
        message="Are you ready to start this sprint? This will mark the sprint as active."
        confirmText="Start Sprint"
      />

      <ConfirmModal
        isOpen={showCompleteSprintModal}
        onConfirm={handleCompleteSprint}
        onCancel={() => setShowCompleteSprintModal(false)}
        title="Complete Sprint"
        message="Are you ready to complete this sprint? Any incomplete tasks will need to be moved."
        confirmText="Complete Sprint"
      />
    </>
  );
};

export default SprintDetailModal;
