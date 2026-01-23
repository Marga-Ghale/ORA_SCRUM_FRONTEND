// src/components/modals/DeleteModals.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Trash2, FolderX, Hash, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

// ==================== Delete Space Modal ====================
interface DeleteSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: { id: string; name: string; color?: string } | null;
  onDelete: (id: string) => Promise<void>;
}

export const DeleteSpaceModal: React.FC<DeleteSpaceModalProps> = ({
  isOpen,
  onClose,
  space,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isDeleting]);

  const handleDelete = async () => {
    if (!space) return;
    setIsDeleting(true);
    try {
      await onDelete(space.id);
      toast.success('Space deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete space');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !space) return null;

  const accentColor = space.color || '#8B5CF6';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-in fade-in duration-150"
        onClick={() => !isDeleting && onClose()}
      />

      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon Header */}
          <div className="pt-8 pb-4 flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: `${accentColor}15`,
                boxShadow: `0 8px 32px ${accentColor}20`,
              }}
            >
              <Layers className="w-8 h-8" style={{ color: accentColor }} strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Space
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Are you sure you want to delete
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              "{space.name}"?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              All folders, projects, and tasks inside will be permanently deleted.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => !isDeleting && onClose()}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ==================== Delete Folder Modal ====================
interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: { id: string; name: string; color?: string } | null;
  onDelete: (id: string) => Promise<void>;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isDeleting]);

  const handleDelete = async () => {
    if (!folder) return;
    setIsDeleting(true);
    try {
      await onDelete(folder.id);
      toast.success('Folder deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete folder');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !folder) return null;

  const accentColor = folder.color || '#F59E0B';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-in fade-in duration-150"
        onClick={() => !isDeleting && onClose()}
      />

      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon Header */}
          <div className="pt-8 pb-4 flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: `${accentColor}15`,
                boxShadow: `0 8px 32px ${accentColor}20`,
              }}
            >
              <FolderX className="w-8 h-8" style={{ color: accentColor }} strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Folder
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Are you sure you want to delete
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              "{folder.name}"?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              All projects and tasks inside will be permanently deleted.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => !isDeleting && onClose()}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ==================== Delete Project Modal ====================
interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: { id: string; name: string; key?: string; color?: string } | null;
  onDelete: (id: string) => Promise<void>;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isDeleting]);

  const handleDelete = async () => {
    if (!project) return;
    setIsDeleting(true);
    try {
      await onDelete(project.id);
      toast.success('Project deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !project) return null;

  const accentColor = project.color || '#6366F1';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-in fade-in duration-150"
        onClick={() => !isDeleting && onClose()}
      />

      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon Header */}
          <div className="pt-8 pb-4 flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: `${accentColor}15`,
                boxShadow: `0 8px 32px ${accentColor}20`,
              }}
            >
              <Hash className="w-8 h-8" style={{ color: accentColor }} strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Project
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Are you sure you want to delete
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              "{project.name}"
              {project.key && <span className="text-gray-400 ml-1">({project.key})</span>}?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              All tasks, comments, and attachments will be permanently deleted.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => !isDeleting && onClose()}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
