// src/components/modals/AddProjectMemberModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Search, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAddMember, useDirectMembers, useEffectiveMembers } from '../../hooks/api/useMembers';

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  projectName?: string;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Can manage project settings and members' },
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

  // Fetch workspace members (all potential members)
  const { data: workspaceMembers, isLoading: isLoadingWorkspace } = useEffectiveMembers(
    'workspace',
    workspaceId || '',
    { enabled: !!workspaceId && isOpen }
  );

  // Fetch current project members
  const { data: projectMembers, isLoading: isLoadingProject } = useDirectMembers(
    'project',
    projectId || '',
    { enabled: !!projectId && isOpen }
  );

  // Add member mutation
  const addMemberMutation = useAddMember();

  const isLoading = isLoadingWorkspace || isLoadingProject;

  // Get available members (workspace members who are NOT in the project)
  const availableMembers = useMemo(() => {
    if (!workspaceMembers) return [];
    if (!projectMembers) return workspaceMembers;

    const projectMemberIds = new Set(projectMembers.map((m) => m.userId));
    return workspaceMembers.filter((member) => !projectMemberIds.has(member.userId));
  }, [workspaceMembers, projectMembers]);

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return availableMembers;
    const query = searchQuery.toLowerCase();
    return availableMembers.filter(
      (member) =>
        member.user?.name.toLowerCase().includes(query) ||
        member.user?.email.toLowerCase().includes(query)
    );
  }, [availableMembers, searchQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMembers(new Map());
      setSearchQuery('');
    }
  }, [isOpen]);

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
    if (!projectId) return;

    setIsSubmitting(true);
    const toastId = toast.loading(`Adding ${selectedMembers.size} member(s)...`);

    try {
      const promises = Array.from(selectedMembers.entries()).map(([userId, role]) =>
        addMemberMutation.mutateAsync({
          entityType: 'project',
          entityId: projectId,
          data: { userId, role },
        })
      );

      await Promise.all(promises);

      toast.dismiss(toastId);
      toast.success(`Added ${selectedMembers.size} member(s) to ${projectName || 'project'}`);

      setSelectedMembers(new Map());
      setSearchQuery('');
      onClose();
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Failed to add members:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedMembers(new Map());
      setSearchQuery('');
      onClose();
    }
  };

  if (!isOpen) return null;

  // Show error if IDs are missing
  const hasMissingIds = !workspaceId || !projectId;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Project Members
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add members to{' '}
                  <span className="font-medium">{projectName || 'this project'}</span>
                </p>
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

          {/* Error State */}
          {hasMissingIds && (
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Missing Required Information
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Workspace ID or Project ID is missing. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasMissingIds && (
            <>
              {/* Search Bar */}
              <div className="px-6 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Member List */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-gray-500">Loading members...</p>
                    </div>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {availableMembers.length === 0
                          ? 'All workspace members are already in this project'
                          : 'No members found'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {availableMembers.length === 0
                          ? 'Invite more people to the workspace first'
                          : 'Try a different search query'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMembers.map((member) => {
                      const isSelected = selectedMembers.has(member.userId);
                      const selectedRole = selectedMembers.get(member.userId) || 'member';

                      return (
                        <div
                          key={member.userId}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => handleToggleMember(member.userId)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-brand-500 border-brand-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </button>

                            {member.user?.avatar ? (
                              <img
                                src={member.user.avatar}
                                alt={member.user.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-medium text-brand-600 dark:text-brand-400">
                                {member.user?.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2) || '?'}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {member.user?.name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {member.user?.email || ''}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="ml-4">
                              <select
                                value={selectedRole}
                                onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm text-gray-500">
                  {selectedMembers.size > 0 ? (
                    <>
                      <span className="font-medium text-brand-600 dark:text-brand-400">
                        {selectedMembers.size}
                      </span>{' '}
                      member{selectedMembers.size > 1 ? 's' : ''} selected
                    </>
                  ) : (
                    'Select members to add to project'
                  )}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={selectedMembers.size === 0 || isSubmitting}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add {selectedMembers.size > 0 ? selectedMembers.size : ''} Member
                        {selectedMembers.size > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AddProjectMemberModal;
