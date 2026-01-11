import {
  AlertCircle,
  Archive,
  BarChart3,
  Briefcase,
  Folder,
  FolderOpen,
  Lightbulb,
  Package,
  Star,
  Target,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// ==================== Edit Folder Modal ====================
interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: { id: string; name: string; color?: string; icon?: string } | null;
  onUpdate: (id: string, data: { name: string; color?: string; icon?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [icon, setIcon] = useState('folder-open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && folder) {
      setName(folder.name || '');
      setColor(folder.color || '#f59e0b');
      setIcon(folder.icon || 'folder-open');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !folder) {
      toast.error('Folder name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdate(folder.id, { name: name.trim(), color, icon });
      toast.success('Folder updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!folder) return;
    setIsSubmitting(true);
    try {
      await onDelete(folder.id);
      toast.success('Folder deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !folder) return null;

  const colorOptions = [
    { value: '#f59e0b', name: 'Amber' },
    { value: '#6366f1', name: 'Indigo' },
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#ec4899', name: 'Pink' },
    { value: '#ef4444', name: 'Red' },
    { value: '#f97316', name: 'Orange' },
    { value: '#22c55e', name: 'Green' },
    { value: '#14b8a6', name: 'Teal' },
    { value: '#06b6d4', name: 'Cyan' },
    { value: '#3b82f6', name: 'Blue' },
  ];

  const iconOptions = [
    { value: 'folder-open', Icon: FolderOpen, label: 'Folder Open' },
    { value: 'folder', Icon: Folder, label: 'Folder' },
    { value: 'archive', Icon: Archive, label: 'Archive' },
    { value: 'package', Icon: Package, label: 'Package' },
    { value: 'target', Icon: Target, label: 'Target' },
    { value: 'briefcase', Icon: Briefcase, label: 'Briefcase' },
    { value: 'chart', Icon: BarChart3, label: 'Chart' },
    { value: 'wrench', Icon: Wrench, label: 'Wrench' },
    { value: 'lightbulb', Icon: Lightbulb, label: 'Lightbulb' },
    { value: 'star', Icon: Star, label: 'Star' },
  ];

  const SelectedIcon = iconOptions.find((opt) => opt.value === icon)?.Icon || FolderOpen;

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
              {showDeleteConfirm ? 'Delete Folder' : 'Edit Folder'}
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
                Delete "{folder.name}"?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-7 max-w-sm mx-auto leading-relaxed">
                This will permanently delete this folder and all its projects. This action cannot be
                undone.
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
                    'Delete Folder'
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
                Folder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-gray-900 transition-all"
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
                        ? 'bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-500 scale-105'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${icon === value ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}
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
                    {name || 'Folder Name'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your folder</p>
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
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
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
