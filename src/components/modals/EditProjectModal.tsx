import {
  AlertCircle,
  Archive,
  BarChart3,
  Briefcase,
  FileText,
  Folder,
  FolderOpen,
  Inbox,
  Lightbulb,
  Package,
  Palette,
  Rocket,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// ==================== Edit Project Modal ====================
interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
    key?: string;
    description?: string;
    color?: string;
    icon?: string;
  } | null;
  onUpdate: (id: string, data: { name: string; description?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !project) {
      toast.error('Project name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdate(project.id, { name: name.trim(), description: description.trim() });
      toast.success('Project updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      await onDelete(project.id);
      toast.success('Project deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !project) return null;

  const iconMap: Record<string, any> = {
    folder: Folder,
    rocket: Rocket,
    briefcase: Briefcase,
    target: Target,
    chart: BarChart3,
    wrench: Wrench,
    lightbulb: Lightbulb,
    palette: Palette,
    smartphone: Smartphone,
    star: Star,
    'folder-open': FolderOpen,
    package: Package,
    archive: Archive,
    file: FileText,
    inbox: Inbox,
    sparkles: Sparkles,
  };

  const ProjectIcon = iconMap[project.icon || 'target'] || Target;
  const projectColor = project.color || '#3b82f6';

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
                style={{ backgroundColor: projectColor + '20', color: projectColor }}
              >
                <ProjectIcon className="w-5 h-5" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {showDeleteConfirm ? 'Delete Project' : 'Edit Project'}
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
                Delete "{project.name}"?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-7 max-w-sm mx-auto leading-relaxed">
                This will permanently delete this project and all its tasks. This action cannot be
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
                    'Delete Project'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Key (Read-only) */}
            {project.key && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                  Project Key
                </label>
                <div className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-mono text-sm flex items-center justify-between">
                  <span className="font-semibold">{project.key}</span>
                  <span className="px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                    Read-only
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Project key cannot be changed after creation
                </p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-all"
                autoFocus
                maxLength={60}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {name.length}/60 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                Description
                <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the project..."
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-all resize-none"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {description.length}/200 characters
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Preview</p>
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                  style={{ backgroundColor: projectColor + '20', color: projectColor }}
                >
                  <ProjectIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {name || 'Project Name'}
                    </p>
                    {project.key && (
                      <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs font-mono font-semibold text-gray-600 dark:text-gray-400">
                        {project.key}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {description || 'No description'}
                  </p>
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
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
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
