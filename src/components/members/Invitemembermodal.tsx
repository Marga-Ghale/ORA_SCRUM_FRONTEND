// src/components/modals/InviteMemberModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  useInviteToWorkspace,
  useSearchUsers,
  useAddWorkspaceMemberById,
  SearchUserResult,
} from '../../hooks/api/useMembers';
import { useProject } from '../../context/ProjectContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InviteRole = 'admin' | 'member' | 'guest';

interface PendingInvite {
  email: string;
  user?: SearchUserResult;
}

const ROLE_OPTIONS: { value: InviteRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features and settings' },
  { value: 'member', label: 'Member', description: 'Can create and manage tasks and projects' },
  { value: 'guest', label: 'Guest', description: 'Can view and comment only' },
];

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose }) => {
  // Get workspace from context - this is the PRIMARY invitation target
  const { currentWorkspace, allSpaces } = useProject();

  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<InviteRole>('member');
  const [message, setMessage] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Optional: Grant access to specific spaces/projects after workspace invite
  const [grantAccessTo, setGrantAccessTo] = useState<string[]>([]);
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Always invite to workspace
  const workspaceId = currentWorkspace?.id || '';
  const workspaceName = currentWorkspace?.name || 'Workspace';

  const inviteToWorkspace = useInviteToWorkspace(workspaceId);
  const addWorkspaceMember = useAddWorkspaceMemberById(workspaceId);

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery, {
    workspaceId: workspaceId,
  });

  const isSubmitting = inviteToWorkspace.isPending || addWorkspaceMember.isPending;

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      setError(null);
      setSuccess(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isSubmitting]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (searchResultsRef.current && !searchResultsRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email.length >= 2) {
        setSearchQuery(email);
        setShowSearchResults(true);
      } else {
        setSearchQuery('');
        setShowSearchResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [email]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSelectUser = (user: SearchUserResult) => {
    if (pendingInvites.some((p) => p.email === user.email)) {
      setError(`${user.email} is already in the list`);
      return;
    }

    setPendingInvites((prev) => [...prev, { email: user.email, user }]);
    setEmail('');
    setSearchQuery('');
    setShowSearchResults(false);
    setError(null);
    inputRef.current?.focus();
  };

  const handleAddEmail = () => {
    const trimmedEmail = email.toLowerCase().trim();

    if (!trimmedEmail) return;

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (pendingInvites.some((p) => p.email === trimmedEmail)) {
      setError(`${trimmedEmail} is already in the list`);
      return;
    }

    const matchingUser = searchResults?.find((u) => u.email.toLowerCase() === trimmedEmail);

    setPendingInvites((prev) => [
      ...prev,
      {
        email: trimmedEmail,
        user: matchingUser,
      },
    ]);
    setEmail('');
    setSearchQuery('');
    setShowSearchResults(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleRemoveInvite = (emailToRemove: string) => {
    setPendingInvites((prev) => prev.filter((p) => p.email !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate workspace ID
    if (!workspaceId) {
      setError('No workspace selected. Please select a workspace first.');
      return;
    }

    // Add current email if not empty
    const allInvites = [...pendingInvites];
    const trimmedEmail = email.toLowerCase().trim();

    if (trimmedEmail && validateEmail(trimmedEmail)) {
      const matchingUser = searchResults?.find((u) => u.email.toLowerCase() === trimmedEmail);
      if (!allInvites.some((p) => p.email === trimmedEmail)) {
        allInvites.push({ email: trimmedEmail, user: matchingUser });
      }
    }

    if (allInvites.length === 0) {
      setError('Please add at least one email address');
      return;
    }

    try {
      let addedCount = 0;
      let invitedCount = 0;
      const errors: string[] = [];

      for (const invite of allInvites) {
        try {
          if (invite.user) {
            // Add existing user directly to workspace
            await addWorkspaceMember.mutateAsync({
              userId: invite.user.id,
              role: selectedRole,
            });
            addedCount++;
          } else {
            // Send workspace invitation
            await inviteToWorkspace.mutateAsync({
              email: invite.email,
              role: selectedRole,
              message: message.trim() || undefined,
            });
            invitedCount++;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`${invite.email}: ${errorMsg}`);
        }
      }

      const successParts: string[] = [];
      if (addedCount > 0) {
        successParts.push(`${addedCount} member${addedCount > 1 ? 's' : ''} added`);
      }
      if (invitedCount > 0) {
        successParts.push(`${invitedCount} invitation${invitedCount > 1 ? 's' : ''} sent`);
      }

      if (successParts.length > 0) {
        setSuccess(successParts.join(', '));
      }

      if (errors.length > 0) {
        setError(`Some invites failed: ${errors.join('; ')}`);
      }

      if (errors.length === 0) {
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      } else {
        setPendingInvites([]);
        setEmail('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
    }
  };

  const resetForm = () => {
    setEmail('');
    setSearchQuery('');
    setMessage('');
    setSelectedRole('member');
    setPendingInvites([]);
    setGrantAccessTo([]);
    setError(null);
    setSuccess(null);
    setShowRoleDropdown(false);
    setShowSearchResults(false);
    setShowAccessDropdown(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Don't render if no workspace
  if (!currentWorkspace?.id) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={onClose} />
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-yellow-500 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Workspace Selected
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Please select or create a workspace before inviting members.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const selectedRoleOption = ROLE_OPTIONS.find((r) => r.value === selectedRole);
  const hasExistingUsers = pendingInvites.some((p) => p.user);
  const hasNewInvites = pendingInvites.some((p) => !p.user);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-brand-600 dark:text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invite Team Members
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add people to <span className="font-medium">{workspaceName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
          >
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Addresses <span className="text-red-500">*</span>
              </label>

              <div className="min-h-[80px] p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
                {/* Tags */}
                {pendingInvites.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pendingInvites.map((invite) => (
                      <span
                        key={invite.email}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                          invite.user
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                        }`}
                      >
                        {invite.user ? (
                          <>
                            {invite.user.avatar ? (
                              <img
                                src={invite.user.avatar}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-[10px] font-medium">
                                {invite.user.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium">{invite.user.name}</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {invite.email}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(invite.email)}
                          className="hover:opacity-70 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input with search */}
                <div className="relative" ref={searchResultsRef}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => email.length >= 2 && setShowSearchResults(true)}
                    placeholder={
                      pendingInvites.length > 0
                        ? 'Add another email...'
                        : 'Enter email addresses (press Enter to add)'
                    }
                    className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    disabled={isSubmitting}
                  />

                  {/* Search Dropdown */}
                  {showSearchResults && email.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-500">
                          <svg
                            className="w-5 h-5 animate-spin mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        </div>
                      ) : searchResults && searchResults.length > 0 ? (
                        <>
                          {searchResults
                            .filter((user) => !pendingInvites.some((p) => p.email === user.email))
                            .map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                                    {user.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Add directly
                                </span>
                              </button>
                            ))}
                          {validateEmail(email) &&
                            !searchResults.some(
                              (u) => u.email.toLowerCase() === email.toLowerCase()
                            ) && (
                              <button
                                type="button"
                                onClick={handleAddEmail}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-t border-gray-100 dark:border-gray-700"
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    Invite "{email}"
                                  </p>
                                  <p className="text-xs text-gray-500">Send invitation email</p>
                                </div>
                              </button>
                            )}
                        </>
                      ) : validateEmail(email) ? (
                        <button
                          type="button"
                          onClick={handleAddEmail}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Invite "{email}"
                            </p>
                            <p className="text-xs text-gray-500">
                              User not found - send invitation email
                            </p>
                          </div>
                        </button>
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Enter a valid email address
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-1.5">
                Search for existing users or enter email addresses to send invitations
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
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left transition-all hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedRoleOption?.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedRoleOption?.description}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.value);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
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
                          <svg
                            className="w-5 h-5 text-brand-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Optional: Grant Access to Spaces/Projects */}
            {allSpaces.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grant Access To <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAccessDropdown(!showAccessDropdown)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left transition-all hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {grantAccessTo.length === 0
                        ? 'All spaces & projects (default)'
                        : `${grantAccessTo.length} space${grantAccessTo.length > 1 ? 's' : ''} selected`}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${showAccessDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showAccessDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {allSpaces.map((space) => (
                        <label
                          key={space.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={grantAccessTo.includes(space.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGrantAccessTo([...grantAccessTo, space.id]);
                              } else {
                                setGrantAccessTo(grantAccessTo.filter((id) => id !== space.id));
                              }
                            }}
                            className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                          />
                          <span className="text-lg">{space.icon || '📁'}</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {space.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Leave empty to grant access to all spaces and projects
                </p>
              </div>
            )}

            {/* Personal Message */}
            {(hasNewInvites || pendingInvites.length === 0) && (
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

            {/* Preview */}
            {pendingInvites.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {hasExistingUsers && (
                      <p>
                        <strong>{pendingInvites.filter((p) => p.user).length}</strong> existing user
                        {pendingInvites.filter((p) => p.user).length > 1 ? 's' : ''} will be added
                        immediately
                      </p>
                    )}
                    {hasNewInvites && (
                      <p>
                        <strong>{pendingInvites.filter((p) => !p.user).length}</strong> invitation
                        {pendingInvites.filter((p) => !p.user).length > 1 ? 's' : ''} will be sent
                        (expires in 7 days)
                      </p>
                    )}
                    <p className="text-blue-600 dark:text-blue-400">
                      All will join <strong>{workspaceName}</strong> as{' '}
                      <strong className="capitalize">{selectedRole}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy invite link
            </button>

            <div className="flex items-center gap-3">
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
                disabled={(pendingInvites.length === 0 && !validateEmail(email)) || isSubmitting}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    <span>
                      {pendingInvites.length > 0
                        ? `Send ${pendingInvites.length} Invite${pendingInvites.length > 1 ? 's' : ''}`
                        : 'Send Invitation'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InviteMemberModal;
