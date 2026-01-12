/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Folder,
  Target,
  Briefcase,
  BarChart3,
  Wrench,
  Lightbulb,
  Star,
  Rocket,
  Palette,
  Smartphone,
  AlertCircle,
} from 'lucide-react';

// Toast notification component
const toast = {
  success: (msg: string) => console.log('✓', msg),
  error: (msg: string) => console.error('✗', msg),
};

// ==================== Edit Space Modal ====================
interface EditSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: { id: string; name: string; color?: string; icon?: string } | null;
  onUpdate: (id: string, data: { name: string; color?: string; icon?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditSpaceModal: React.FC<EditSpaceModalProps> = ({
  isOpen,
  onClose,
  space,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('folder');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && space) {
      setName(space.name || '');
      setColor(space.color || '#6366f1');
      setIcon(space.icon || 'folder');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, space]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !space) {
      toast.error('Space name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdate(space.id, { name: name.trim(), color, icon });
      toast.success('Space updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update space');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!space) return;
    setIsSubmitting(true);
    try {
      await onDelete(space.id);
      toast.success('Space deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete space');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !space) return null;

  const colorOptions = [
    { value: '#6366f1', name: 'Indigo' },
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#ec4899', name: 'Pink' },
    { value: '#ef4444', name: 'Red' },
    { value: '#f97316', name: 'Orange' },
    { value: '#eab308', name: 'Yellow' },
    { value: '#22c55e', name: 'Green' },
    { value: '#14b8a6', name: 'Teal' },
    { value: '#06b6d4', name: 'Cyan' },
    { value: '#3b82f6', name: 'Blue' },
  ];

  const iconOptions = [
    { value: 'folder', Icon: Folder, label: 'Folder' },
    { value: 'rocket', Icon: Rocket, label: 'Rocket' },
    { value: 'briefcase', Icon: Briefcase, label: 'Briefcase' },
    { value: 'target', Icon: Target, label: 'Target' },
    { value: 'chart', Icon: BarChart3, label: 'Chart' },
    { value: 'wrench', Icon: Wrench, label: 'Wrench' },
    { value: 'lightbulb', Icon: Lightbulb, label: 'Lightbulb' },
    { value: 'palette', Icon: Palette, label: 'Palette' },
    { value: 'smartphone', Icon: Smartphone, label: 'Smartphone' },
    { value: 'star', Icon: Star, label: 'Star' },
  ];

  const SelectedIcon = iconOptions.find((opt) => opt.value === icon)?.Icon || Folder;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {showDeleteConfirm ? (
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + '20', color }}
              >
                <SelectedIcon className="w-5 h-5" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {showDeleteConfirm ? 'Delete Space' : 'Edit Space'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {showDeleteConfirm ? (
          <div className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Delete "{space.name}"?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-7 max-w-sm mx-auto leading-relaxed">
                This will permanently delete this space and all its folders and projects. This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    'Delete Space'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                Space Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter space name..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-all"
                autoFocus
                maxLength={50}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {name.length}/50 characters
              </p>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map(({ value, Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIcon(value)}
                    title={label}
                    className={`relative h-12 rounded-xl flex items-center justify-center transition-all ${
                      icon === value
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500 scale-105'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${icon === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                Color Theme
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(({ value, name }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setColor(value)}
                    title={name}
                    className={`relative h-12 rounded-xl transition-all ${
                      color === value
                        ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900 scale-105'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: value }}
                  >
                    {color === value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: value }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: color + '20', color }}
                >
                  <SelectedIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {name || 'Space Name'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your workspace</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
