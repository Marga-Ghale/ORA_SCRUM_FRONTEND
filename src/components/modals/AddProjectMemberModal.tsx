// src/components/modals/AddProjectMemberModal.tsx
import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Check, AlertCircle } from 'lucide-react';
import { useAddProjectMemberById, useAvailableMembers } from '../../hooks/api/useMembers';
import toast from 'react-hot-toast';

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  projectName?: string;
}

const ROLE_OPTIONS = [
  { value: 'lead', label: 'Lead', description: 'Can manage project settings and members' },
  { value: 'member', label: 'Member', description: 'Can create and edit tasks' },
  { value: 'viewer', label: 'Viewer', description: 'Can only view tasks' },
];

const AddProjectMemberModal: React.FC<AddProjectMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  projectName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Map<string, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log the IDs
  useEffect(() => {
    if (isOpen) {
      console.log('AddProjectMemberModal opened:', { workspaceId, projectId, projectName });
    }
  }, [isOpen, workspaceId, projectId, projectName]);

  const { availableMembers, isLoading, error, workspaceMembers, projectMembers } =
    useAvailableMembers(workspaceId || undefined, projectId || undefined);

  const addMember = useAddProjectMemberById(projectId);

  // Debug: Log the members data
  useEffect(() => {
    console.log('Members data:', {
      availableMembers: availableMembers.length,
      workspaceMembers: workspaceMembers.length,
      projectMembers: projectMembers.length,
      isLoading,
      error,
    });
  }, [availableMembers, workspaceMembers, projectMembers, isLoading, error]);

  // Filter members by search query
  const filteredMembers = availableMembers.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.user.name.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query)
    );
  });

  const handleToggleMember = (userId: string) => {
    setSelectedMembers((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(userId)) {
        newMap.delete(userId);
      } else {
        newMap.set(userId, 'member');
      }
      return newMap;
    });
  };

  const handleRoleChange = (userId: string, role: string) => {
    setSelectedMembers((prev) => {
      const newMap = new Map(prev);
      newMap.set(userId, role);
      return newMap;
    });
  };

  const handleSubmit = async () => {
    if (selectedMembers.size === 0) return;

    setIsSubmitting(true);

    const toastId = toast.loading(`Adding ${selectedMembers.size} member(s)...`);

    try {
      const promises = Array.from(selectedMembers.entries()).map(([userId, role]) =>
        addMember.mutateAsync({ userId, role })
      );

      await Promise.all(promises);

      toast.dismiss(toastId);
      toast.success(`Added ${selectedMembers.size} member(s) to project`);

      setSelectedMembers(new Map());
      setSearchQuery('');
      onClose();
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Failed to add members:', error);
      toast.error('Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers(new Map());
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  // Show error if IDs are missing
  const hasMissingIds = !workspaceId || !projectId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                <UserPlus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Members</h2>
                {projectName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">to {projectName}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error state for missing IDs */}
          {hasMissingIds ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Unable to load members</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Missing {!workspaceId ? 'workspace' : ''} {!workspaceId && !projectId ? 'and' : ''}{' '}
                {!projectId ? 'project' : ''} ID
              </p>
              <p className="text-xs text-gray-400 mt-2">
                workspaceId: {workspaceId || 'null'}, projectId: {projectId || 'null'}
              </p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search workspace members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                {/* Debug info */}
                <p className="text-xs text-gray-400 mt-2">
                  Workspace members: {workspaceMembers.length} | Project members:{' '}
                  {projectMembers.length} | Available: {availableMembers.length}
                </p>
              </div>

              {/* Members List */}
              <div className="p-4 max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">Failed to load members</p>
                    <p className="text-xs text-gray-400 mt-1">{String(error)}</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {availableMembers.length === 0
                        ? workspaceMembers.length === 0
                          ? 'No workspace members found. Add members to the workspace first.'
                          : 'All workspace members are already in this project'
                        : 'No members found matching your search'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMembers.map((member) => {
                      const isSelected = selectedMembers.has(member.userId);
                      const selectedRole = selectedMembers.get(member.userId) || 'member';

                      return (
                        <div
                          key={member.userId}
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                              : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => handleToggleMember(member.userId)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative">
                              {member.user.avatar ? (
                                <img
                                  src={member.user.avatar}
                                  alt={member.user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                                  <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                                    {member.user.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {member.user.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {member.user.email}
                              </p>
                            </div>

                            {/* Role Selector */}
                            {isSelected && (
                              <select
                                value={selectedRole}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleRoleChange(member.userId, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedMembers.size > 0
                    ? `${selectedMembers.size} member(s) selected`
                    : 'Select members to add'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={selectedMembers.size === 0 || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isSubmitting
                      ? 'Adding...'
                      : `Add ${selectedMembers.size || ''} Member${selectedMembers.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProjectMemberModal;
