// ✅ COMPLETE REPLACEMENT: src/components/modals/InviteMemberModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UserPlus,
  Search,
  Check,
  Loader,
  Info,
  Crown,
  Shield,
  Eye,
  Users,
  ChevronDown,
} from 'lucide-react';
import { useAddMember, useInviteMemberByEmail } from '../../hooks/api/useMembers';
import { useSearchUsers } from '../../hooks/useUsers';
import { EntityType } from '../../types/entity';
import { HierarchicalEntitySelector } from '../members/HierarchicalEntitySelector';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEntity?: { type: EntityType; id: string; name: string };
}

type InviteRole = 'owner' | 'admin' | 'lead' | 'member' | 'viewer';

interface SearchUserResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface PendingInvite {
  email: string;
  user?: SearchUserResult;
}

const ROLE_OPTIONS: {
  value: InviteRole;
  label: string;
  description: string;
  icon: any;
  level: number;
}[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full control, can delete',
    icon: Crown,
    level: 5,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage members & settings',
    icon: Shield,
    level: 4,
  },
  { value: 'lead', label: 'Lead', description: 'Add members to projects', icon: Users, level: 3 },
  { value: 'member', label: 'Member', description: 'Work on tasks', icon: Users, level: 2 },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access', icon: Eye, level: 1 },
];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  defaultEntity,
}) => {
  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<InviteRole>('member');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: EntityType;
    id: string;
    name: string;
  } | null>(defaultEntity || null);

  const inputRef = useRef<HTMLInputElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const addMemberMutation = useAddMember();
  const inviteMemberMutation = useInviteMemberByEmail();
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery, {
    enabled: searchQuery.length >= 2,
  });

  const isSubmitting = addMemberMutation.isPending || inviteMemberMutation.isPending;

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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isSubmitting]);

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

    if (!selectedEntity) {
      setError('Please select a workspace, space, folder, or project');
      return;
    }

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
            await addMemberMutation.mutateAsync({
              entityType: selectedEntity.type,
              entityId: selectedEntity.id,
              data: {
                userId: invite.user.id,
                role: selectedRole,
              },
            });
            addedCount++;
          } else {
            await inviteMemberMutation.mutateAsync({
              entityType: selectedEntity.type,
              entityId: selectedEntity.id,
              data: {
                email: invite.email,
                role: selectedRole,
              },
            });
            invitedCount++;
          }
        } catch (err: any) {
          const errorMsg = err?.response?.data?.error || err?.message || 'Unknown error';
          errors.push(`${invite.email}: ${errorMsg}`);
        }
      }

      const successParts: string[] = [];
      if (addedCount > 0) {
        successParts.push(`${addedCount} member${addedCount > 1 ? 's' : ''} added`);
      }
      if (invitedCount > 0) {
        successParts.push(`${invitedCount} user${invitedCount > 1 ? 's' : ''} found by email`);
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
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to send invitations');
    }
  };

  const resetForm = () => {
    setEmail('');
    setSearchQuery('');
    setSelectedRole('member');
    setPendingInvites([]);
    setError(null);
    setSuccess(null);
    setShowRoleDropdown(false);
    setShowSearchResults(false);
    if (!defaultEntity) {
      setSelectedEntity(null);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedRoleOption = ROLE_OPTIONS.find((r) => r.value === selectedRole);
  const RoleIcon = selectedRoleOption?.icon || Users;

  const getAccessInfo = () => {
    if (!selectedEntity) return null;

    const { type } = selectedEntity;

    if (type === 'workspace') {
      return {
        direct: 'Full access to workspace',
        inherited: ['All spaces', 'All folders', 'All projects', 'All tasks'],
      };
    }
    if (type === 'space') {
      return {
        direct: 'Access to this space',
        inherited: ['All folders in space', 'All projects in space', 'All tasks in projects'],
      };
    }
    if (type === 'folder') {
      return {
        direct: 'Access to this folder',
        inherited: ['All projects in folder', 'All tasks in projects'],
      };
    }
    if (type === 'project') {
      return {
        direct: 'Access to this project',
        inherited: ['All tasks in project'],
      };
    }
    return null;
  };

  const accessInfo = getAccessInfo();

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={handleClose} />

      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 md:p-8">
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
                  Invite Team Members
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add people by user ID or email
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

          {/* Messages */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex gap-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
          >
            {/* Entity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add to <span className="text-red-500">*</span>
              </label>
              <HierarchicalEntitySelector
                value={selectedEntity}
                onChange={setSelectedEntity}
                disabled={isSubmitting || !!defaultEntity}
              />
              {selectedEntity && accessInfo && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Members will get:</p>
                      <ul className="space-y-1">
                        <li>• {accessInfo.direct}</li>
                        {accessInfo.inherited.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Addresses <span className="text-red-500">*</span>
              </label>

              <div className="min-h-[80px] p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
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
                            <span>{invite.email}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(invite.email)}
                          className="hover:opacity-70 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

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

                  {showSearchResults && email.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-500">
                          <Loader className="w-5 h-5 animate-spin mx-auto" />
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
                                  <Search className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    Add "{email}"
                                  </p>
                                  <p className="text-xs text-gray-500">Find by email</p>
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
                            <Search className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Add "{email}"
                            </p>
                            <p className="text-xs text-gray-500">Find user by email</p>
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
                Search for existing users or enter email addresses
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
                  <div className="flex items-center gap-3">
                    <RoleIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedRoleOption?.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedRoleOption?.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                    {ROLE_OPTIONS.map((role) => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => {
                            setSelectedRole(role.value);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            selectedRole === role.value ? 'bg-brand-50 dark:bg-brand-900/30' : ''
                          }`}
                        >
                          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                          <div className="flex-1 text-left">
                            <span
                              className={`text-sm font-medium ${
                                selectedRole === role.value
                                  ? 'text-brand-600 dark:text-brand-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {role.label}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                          </div>
                          {selectedRole === role.value && (
                            <Check className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (pendingInvites.length === 0 && email.trim() === '') ||
                !selectedEntity
              }
              className="px-5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Send Invites
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
