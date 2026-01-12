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
} from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPACE_ICONS: LucideIcon[] = [
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
  const [icon, setIcon] = useState<LucideIcon>(SPACE_ICONS[0]);
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
        icon: SPACE_ICONS.indexOf(icon).toString(),
        color,
      });

      // Reset form
      setName('');
      setDescription('');
      setIcon(SPACE_ICONS[0]);
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
    setIcon(SPACE_ICONS[0]);
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

  const IconComponent = icon;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ backgroundColor: `${color}20`, color: color }}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Space
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Organize your projects</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Icon & Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Icon & Color
              </label>
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-16 h-16 rounded-xl flex items-center justify-center transition-all hover:scale-105 flex-shrink-0 ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600"
                  style={{ backgroundColor: `${color}20`, color: color }}
                  disabled={isSubmitting}
                >
                  <IconComponent className="w-8 h-8" />
                </button>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Click icon to change • Select color below
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SPACE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        disabled={isSubmitting}
                        className={`w-7 h-7 rounded-lg transition-all duration-200 ${
                          color === c
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Icon Picker Grid */}
            {showIconPicker && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Choose an icon
                </p>
                <div className="grid grid-cols-8 gap-2">
                  {SPACE_ICONS.map((Icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIcon(Icon);
                        setShowIconPicker(false);
                      }}
                      disabled={isSubmitting}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                        ${
                          icon === Icon
                            ? 'bg-brand-100 dark:bg-brand-900/50 ring-2 ring-brand-500'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Space Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Space Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Engineering, Marketing, Design, Product"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
                disabled={isSubmitting}
                maxLength={50}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this space for? Who will use it?"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                disabled={isSubmitting}
                maxLength={200}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/200</p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">What is a Space?</p>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">
                    Spaces help you organize related projects together, like teams or departments.
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 min-w-[130px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
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
