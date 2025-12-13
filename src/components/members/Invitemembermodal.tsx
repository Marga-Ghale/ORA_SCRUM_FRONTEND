// src/components/modals/InviteMemberModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  useInviteToWorkspace, 
  useInviteToProject,
  useSearchUsers,
  useAddWorkspaceMemberById,
  useAddProjectMemberById,
  SearchUserResult
} from '../../hooks/api/useMembers';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'workspace' | 'project';
  targetId: string;
  targetName: string;
}

type InviteRole = 'admin' | 'member' | 'guest';

const ROLE_OPTIONS: { value: InviteRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Can manage members and settings' },
  { value: 'member', label: 'Member', description: 'Can create and edit content' },
  { value: 'guest', label: 'Guest', description: 'Can view and comment only' },
];

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
}) => {
  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<InviteRole>('member');
  const [message, setMessage] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Hooks based on type
  const inviteToWorkspace = useInviteToWorkspace(type === 'workspace' ? targetId : '');
  const inviteToProject = useInviteToProject(type === 'project' ? targetId : '');
  const addWorkspaceMember = useAddWorkspaceMemberById(type === 'workspace' ? targetId : '');
  const addProjectMember = useAddProjectMemberById(type === 'project' ? targetId : '');
  
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery, {
    workspaceId: type === 'workspace' ? targetId : undefined,
    projectId: type === 'project' ? targetId : undefined,
  });

  const inviteMutation = type === 'workspace' ? inviteToWorkspace : inviteToProject;
  const addMemberMutation = type === 'workspace' ? addWorkspaceMember : addProjectMember;
  const isSubmitting = inviteMutation.isPending || addMemberMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
      setError(null);
      setSuccess(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isSubmitting]);

  // Close role dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search query when email changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email.length >= 2 && !selectedUser) {
        setSearchQuery(email);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [email, selectedUser]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSelectUser = (user: SearchUserResult) => {
    setSelectedUser(user);
    setEmail(user.email);
    setSearchQuery('');
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setEmail('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      if (selectedUser) {
        // Add existing user directly
        await addMemberMutation.mutateAsync({
          userId: selectedUser.id,
          role: selectedRole,
        });
        setSuccess(`${selectedUser.name} has been added to ${targetName}`);
      } else {
        // Send invitation
        await inviteMutation.mutateAsync({
          email: email.trim(),
          role: selectedRole,
          message: message.trim() || undefined,
        });
        setSuccess(`Invitation sent to ${email.trim()}`);
      }

      // Reset form after success
      setTimeout(() => {
        setEmail('');
        setMessage('');
        setSelectedUser(null);
        setSelectedRole('member');
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  const resetForm = () => {
    setEmail('');
    setSearchQuery('');
    setMessage('');
    setSelectedRole('member');
    setSelectedUser(null);
    setError(null);
    setSuccess(null);
    setShowRoleDropdown(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedRoleOption = ROLE_OPTIONS.find(r => r.value === selectedRole);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invite to {type === 'workspace' ? 'Workspace' : 'Project'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{targetName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Email Input with Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {selectedUser ? (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt={selectedUser.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                        {selectedUser.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedUser.name}</p>
                      <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearUser}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                      disabled={isSubmitting}
                    />
                    
                    {/* Search Results Dropdown */}
                    {searchQuery.length >= 2 && (searchResults?.length || isSearching) && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-4 text-center text-gray-500">
                            <svg className="w-5 h-5 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        ) : searchResults?.length ? (
                          searchResults.map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSelectUser(user)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No users found. They'll receive an invitation email.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {selectedUser 
                  ? 'This user will be added immediately'
                  : 'Search for existing users or enter an email to send an invitation'}
              </p>
            </div>

            {/* Role Selection */}
            <div ref={roleDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left transition-all hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedRoleOption?.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedRoleOption?.description}</p>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
                    {ROLE_OPTIONS.map(role => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.value);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          selectedRole === role.value ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                        }`}
                      >
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {role.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                        </div>
                        {selectedRole === role.value && (
                          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Optional Message (only for invitations) */}
            {!selectedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personal Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal note to your invitation..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/500</p>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedUser ? (
                    <p>This user will be added to <strong>{targetName}</strong> immediately with <strong>{selectedRoleOption?.label}</strong> permissions.</p>
                  ) : (
                    <p>An invitation email will be sent to this address. The invitation expires in 7 days.</p>
                  )}
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
              disabled={!email.trim() || isSubmitting}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{selectedUser ? 'Adding...' : 'Sending...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {selectedUser ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    )}
                  </svg>
                  <span>{selectedUser ? 'Add Member' : 'Send Invitation'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InviteMemberModal;