/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/modals/CreateSpaceModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import {
  X,
  AlertCircle,
  Info,
  Plus,
  Loader2,
  Laptop,
  Megaphone,
  Target,
  Rocket,
  BarChart3,
  Palette,
  FileText,
  Settings,
  Microscope,
  BookOpen,
  Briefcase,
  Gamepad2,
  Wrench,
  TrendingUp,
  Globe,
  Lightbulb,
  Hammer,
  Smartphone,
  Music,
  Film,
  Package,
  Lock,
  Star,
  Zap,
  type LucideIcon,
  FolderKanban,
} from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPACE_ICON_OPTIONS = [
  { value: 'laptop', Icon: Laptop },
  { value: 'megaphone', Icon: Megaphone },
  { value: 'target', Icon: Target },
  { value: 'rocket', Icon: Rocket },
  { value: 'chart', Icon: BarChart3 },
  { value: 'palette', Icon: Palette },
  { value: 'file', Icon: FileText },
  { value: 'settings', Icon: Settings },
  { value: 'microscope', Icon: Microscope },
  { value: 'book', Icon: BookOpen },
  { value: 'briefcase', Icon: Briefcase },
  { value: 'gamepad', Icon: Gamepad2 },
  { value: 'wrench', Icon: Wrench },
  { value: 'trending', Icon: TrendingUp },
  { value: 'globe', Icon: Globe },
  { value: 'lightbulb', Icon: Lightbulb },
  { value: 'hammer', Icon: Hammer },
  { value: 'smartphone', Icon: Smartphone },
  { value: 'music', Icon: Music },
  { value: 'film', Icon: Film },
  { value: 'package', Icon: Package },
  { value: 'lock', Icon: Lock },
  { value: 'star', Icon: Star },
  { value: 'zap', Icon: Zap },
];

const SPACE_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#E11D48',
];

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose }) => {
  const { createSpace } = useProjectContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('laptop');
  const [color, setColor] = useState(SPACE_COLORS[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
      document.body.style.overflow = 'hidden';
      setError(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Space name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createSpace({
        name: name.trim(),
        icon: icon,
        color,
      });

      // Reset form
      setName('');
      setDescription('');
      setIcon(SPACE_ICON_OPTIONS[0].value);
      setColor(SPACE_COLORS[0]);
      setShowIconPicker(false);
      onClose();
    } catch (err) {
      console.error('Failed to create space:', err);
      setError(err instanceof Error ? err.message : 'Failed to create space. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon(SPACE_ICON_OPTIONS[0].value);
    setColor(SPACE_COLORS[0]);
    setShowIconPicker(false);
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const IconComponent = SPACE_ICON_OPTIONS.find((opt) => opt.value === icon)?.Icon || Laptop;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md z-[99999]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4">
        <div
          className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-5 sm:px-7 py-6 sm:py-7 border-b border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg ring-1 ring-black/5 dark:ring-white/10"
                  style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    boxShadow: `0 4px 20px ${color}25`,
                  }}
                >
                  <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Create Space
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Organize your workflow
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all disabled:opacity-50 -mt-1"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-5 sm:mx-7 mt-5 p-4 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-950/40 dark:to-red-950/20 border border-red-200 dark:border-red-800/50 rounded-2xl animate-in slide-in-from-top-2">
              <div className="flex gap-3">
                <AlertCircle
                  className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-6"
          >
            {/* Icon & Color Picker */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Appearance
              </label>
              <div className="flex items-start gap-5">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 flex-shrink-0 ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600 shadow-lg group"
                  style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    boxShadow: `0 8px 25px ${color}20`,
                  }}
                  disabled={isSubmitting}
                >
                  <IconComponent
                    className="w-10 h-10 sm:w-12 sm:h-12 transition-transform group-hover:rotate-12"
                    strokeWidth={2}
                  />
                </button>
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Pick your color
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {SPACE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        disabled={isSubmitting}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                          color === c
                            ? 'ring-3 ring-offset-3 ring-offset-white dark:ring-offset-gray-900 scale-110 shadow-xl'
                            : 'hover:scale-110 active:scale-95'
                        }`}
                        style={{
                          backgroundColor: c,
                          // ringColor: color === c ? c : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Icon Picker Grid */}
            {showIconPicker && (
              <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-3 shadow-inner">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  Choose Icon
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {SPACE_ICON_OPTIONS.map(({ value, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setIcon(value);
                        setShowIconPicker(false);
                      }}
                      disabled={isSubmitting}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                        icon === value
                          ? 'text-white shadow-lg ring-2 ring-brand-500'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm'
                      }`}
                      style={{
                        backgroundColor: icon === value ? color : undefined,
                      }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Space Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Space Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering, Marketing, Design..."
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-base"
                required
                disabled={isSubmitting}
                maxLength={50}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Description{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">
                  (optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this space for?"
                rows={3}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-base"
                disabled={isSubmitting}
                maxLength={200}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right font-medium">
                {description.length}/200
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50 shadow-sm">
              <div className="flex gap-3">
                <Info
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">About Spaces</p>
                  <p className="mt-1 text-blue-700 dark:text-blue-300 leading-relaxed">
                    Group related projects together for better organization.
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-7 py-5 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-transparent dark:from-gray-800/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center shadow-lg hover:shadow-xl active:scale-95 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  <span>Create Space</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateSpaceModal;
