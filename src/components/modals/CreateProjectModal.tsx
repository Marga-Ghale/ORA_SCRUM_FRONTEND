// src/components/modals/CreateProjectModal.tsx - FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Info, Plus, Loader2, Hash } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; key: string; description?: string }) => Promise<void>;
  /** Optional: Display name for where the project is being created */
  parentName?: string;
  /** Optional: Type of parent (space or folder) */
  parentType?: 'space' | 'folder';
}

const PROJECT_COLORS = [
  '#6366F1', // Violet (default)
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#14B8A6',
  '#F97316',
  '#E11D48',
];

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  parentName,
  parentType = 'space',
}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Generate project key from name
  const generateKey = (projectName: string): string => {
    const words = projectName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) return '';
    if (words.length === 1) {
      return words[0].slice(0, 4);
    }
    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 5);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setKey('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      setIsKeyManuallyEdited(false);
      setError(null);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-generate key when name changes (unless manually edited)
  useEffect(() => {
    if (!isKeyManuallyEdited && name) {
      const generated = generateKey(name);
      setKey(generated.length >= 2 ? generated : '');
    }
  }, [name, isKeyManuallyEdited]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSubmitting]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError(null);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    setKey(value);
    setIsKeyManuallyEdited(true);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedKey = key.trim();

    if (!trimmedName) {
      setError('Project name is required');
      nameInputRef.current?.focus();
      return;
    }

    if (!trimmedKey || trimmedKey.length < 2) {
      setError('Project key must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        name: trimmedName,
        key: trimmedKey,
        description: description.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setKey('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      setIsKeyManuallyEdited(false);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}20`, color: color }}
              >
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Project
                </h2>
                {parentName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    in {parentType === 'folder' ? '📁' : '🗂️'} {parentName}
                  </p>
                )}
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
            {/* Project Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Project Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    disabled={isSubmitting}
                    className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                      color === c
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c, ringColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g., Website Redesign, Mobile App, API v2"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>

            {/* Project Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={key}
                  onChange={handleKeyChange}
                  placeholder="e.g., WEB, APP, API"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono uppercase tracking-wider"
                  required
                  disabled={isSubmitting}
                  maxLength={10}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {!isKeyManuallyEdited && key && (
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      Auto
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{key.length}/10</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Used for task IDs (e.g., <span className="font-mono">{key || 'KEY'}-123</span>)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project goals, scope, or key deliverables..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                disabled={isSubmitting}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-violet-700 dark:text-violet-300">
                  <p className="font-medium">What is a Project?</p>
                  <p className="mt-1 text-violet-600 dark:text-violet-400">
                    Projects contain tasks and help you track work. The project key is used for task
                    IDs.
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
              disabled={!name.trim() || !key.trim() || key.length < 2 || isSubmitting}
              className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateProjectModal;
