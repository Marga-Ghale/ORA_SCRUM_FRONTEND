// src/components/modals/CreateProjectModal.tsx - FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Info, Plus, Loader2, Hash } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (data: {
    name: string;
    key: string;
    description?: string;
    spaceId?: string;
    folderId?: string;
  }) => Promise<void>;
  parentName?: string;
  parentType?: 'space' | 'folder';
  spaceId?: string;
  folderId?: string;
}

const PROJECT_COLORS = [
  '#6366F1',
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
  spaceId,
  folderId,
}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const generateKey = (projectName: string): string => {
    const words = projectName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) return '';
    if (words.length === 1) return words[0].slice(0, 4);

    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 5);
  };

  // 🔍 DEBUG: Log props when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 CreateProjectModal Props:', {
        onCreate: typeof onCreate,
        onCreateExists: !!onCreate,
        spaceId,
        folderId,
        parentName,
        parentType,
      });
    }
  }, [isOpen, onCreate, spaceId, folderId, parentName, parentType]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setKey('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      setIsKeyManuallyEdited(false);
      setError(null);
      setTimeout(() => nameInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isKeyManuallyEdited && name) {
      const generated = generateKey(name);
      setKey(generated.length >= 2 ? generated : '');
    }
  }, [name, isKeyManuallyEdited]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) handleClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
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

    if (typeof onCreate !== 'function') {
      setError('Unable to create project. onCreate handler not provided.');
      console.error('CreateProjectModal: onCreate prop is not a function:', typeof onCreate);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // ✅ FIX: Now passing spaceId and folderId
      await onCreate({
        name: trimmedName,
        key: trimmedKey,
        description: description.trim() || undefined,
        spaceId,
        folderId,
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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-violet-500" />
                Create Project
              </h2>
              {parentName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  in {parentType === 'folder' ? '📁' : '🗂️'} {parentName}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Color
              </label>
              <div className="flex gap-2 flex-wrap">
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
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="project-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Project Name *
              </label>
              <input
                ref={nameInputRef}
                id="project-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter project name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>

            <div>
              <label
                htmlFor="project-key"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Project Key *
              </label>
              <div className="relative">
                <input
                  id="project-key"
                  type="text"
                  value={key}
                  onChange={handleKeyChange}
                  placeholder="KEY"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono uppercase"
                  disabled={isSubmitting}
                  maxLength={10}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {!isKeyManuallyEdited && key && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium">
                      Auto
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">{key.length}/10</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Used for task IDs (e.g., {key || 'KEY'}-123)
              </p>
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="project-description"
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
