// src/components/modals/EditFolderModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertCircle,
  Loader2,
  Folder,
  FolderOpen,
  FolderClosed,
  FolderArchive,
  FolderCog,
  FolderEdit,
  FolderHeart,
  FolderKanban,
  FolderLock,
  FolderSearch,
  FolderTree,
  Check,
  type LucideIcon,
} from 'lucide-react';

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: { id: string; name: string; color?: string; icon?: string } | null;
  onUpdate: (id: string, data: { name: string; color?: string; icon?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const FOLDER_ICON_OPTIONS = [
  { value: 'folder', Icon: Folder },
  { value: 'folder-open', Icon: FolderOpen },
  { value: 'folder-closed', Icon: FolderClosed },
  { value: 'folder-kanban', Icon: FolderKanban },
  { value: 'folder-tree', Icon: FolderTree },
  { value: 'folder-archive', Icon: FolderArchive },
  { value: 'folder-cog', Icon: FolderCog },
  { value: 'folder-edit', Icon: FolderEdit },
  { value: 'folder-heart', Icon: FolderHeart },
  { value: 'folder-lock', Icon: FolderLock },
  { value: 'folder-search', Icon: FolderSearch },
];

const FOLDER_COLORS = [
  '#F59E0B',
  '#EF4444',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#14B8A6',
  '#6366F1',
  '#E11D48',
];

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [icon, setIcon] = useState('folder');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && folder) {
      setName(folder.name || '');
      setColor(folder.color || FOLDER_COLORS[0]);
      // Parse icon index from string
      setIcon(folder.icon || 'folder');
      setShowIconPicker(false);
      setError(null);
      setTimeout(() => nameInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, folder]);

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
    if (!name.trim() || !folder) {
      setError('Folder name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate(folder.id, {
        name: name.trim(),
        icon,
        color,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to update folder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !folder) return null;

  const IconComponent = FOLDER_ICON_OPTIONS.find((opt) => opt.value === icon)?.Icon || Folder;

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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Folder</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update folder details</p>
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
                Icon & Color
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
                    {FOLDER_COLORS.map((c) => (
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
                <div className="grid grid-cols-6 gap-1.5">
                  {FOLDER_ICON_OPTIONS.map(({ value, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setIcon(value);
                        setShowIconPicker(false);
                      }}
                      disabled={isSubmitting}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        icon === value
                          ? 'text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={{ backgroundColor: icon === value ? color : undefined }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Q1 Projects, Sprint 1, Backend Tasks..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
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
                <p className="font-medium text-gray-900 dark:text-white">{name || 'Folder Name'}</p>
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

export default EditFolderModal;
