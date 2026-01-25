// src/components/modals/EditSpaceModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertCircle,
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
  Check,
} from 'lucide-react';

interface EditSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: { id: string; name: string; color?: string; icon?: string } | null;
  onUpdate: (id: string, data: { name: string; color?: string; icon?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

export const EditSpaceModal: React.FC<EditSpaceModalProps> = ({
  isOpen,
  onClose,
  space,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SPACE_COLORS[0]);
  const [icon, setIcon] = useState('laptop');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && space) {
      setName(space.name || '');
      setColor(space.color || SPACE_COLORS[0]);
      setIcon(space.icon || 'laptop');
      setShowIconPicker(false);
      setError(null);
      setTimeout(() => nameInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, space]);

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
    if (!name.trim() || !space) {
      setError('Space name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate(space.id, {
        name: name.trim(),
        icon: icon,
        color,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update space:', err);
      setError(err instanceof Error ? err.message : 'Failed to update space. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !space) return null;

  const IconComponent = SPACE_ICON_OPTIONS.find((opt) => opt.value === icon)?.Icon || Laptop;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                }}
              >
                <IconComponent className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Space</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update space details</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Icon & Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Appearance
              </label>
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-16 h-16 rounded-xl flex items-center justify-center transition-all hover:scale-105 flex-shrink-0 ring-2 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700"
                  style={{
                    backgroundColor: `${color}15`,
                    color: color,
                  }}
                  disabled={isSubmitting}
                >
                  <IconComponent className="w-8 h-8" strokeWidth={2} />
                </button>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select color</p>
                  <div className="grid grid-cols-6 gap-2">
                    {SPACE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        disabled={isSubmitting}
                        className={`w-8 h-8 rounded-lg transition-all duration-150 relative ${
                          color === c
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{
                          backgroundColor: c,
                          // ringColor: color === c ? c : 'transparent',
                        }}
                      >
                        {color === c && (
                          <Check
                            className="w-3.5 h-3.5 text-white absolute inset-0 m-auto"
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Icon Picker */}
            {showIconPicker && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Choose icon
                </p>
                <div className="grid grid-cols-8 gap-1.5">
                  {SPACE_ICON_OPTIONS.map(({ value, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setIcon(value);
                        setShowIconPicker(false);
                      }}
                      disabled={isSubmitting}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        icon === value
                          ? 'text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={{ backgroundColor: icon === value ? color : undefined }}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Space Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering, Marketing, Design..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={isSubmitting}
                maxLength={50}
              />
              <p className="text-xs text-gray-400 mt-1.5 text-right">{name.length}/50</p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}15`, color: color }}
                >
                  <IconComponent className="w-5 h-5" strokeWidth={2} />
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{name || 'Space Name'}</p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                backgroundColor: !name.trim() || isSubmitting ? '#9CA3AF' : color,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditSpaceModal;
