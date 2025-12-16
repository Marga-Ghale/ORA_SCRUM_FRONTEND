// src/components/members/MembersList.tsx
import React, { useState } from 'react';
import {
  useWorkspaceMembers,
  useProjectMembers,
  useUpdateWorkspaceMemberRole,
  useRemoveWorkspaceMember,
  useRemoveProjectMember,
} from '../../hooks/api/useMembers';
import { useAuth } from '../UserProfile/AuthContext';

interface MembersListProps {
  type: 'workspace' | 'project';
  targetId: string;
  onInvite?: () => void;
}

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  guest: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
};

const MembersList: React.FC<MembersListProps> = ({ type, targetId, onInvite }) => {
  const { user: currentUser } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const workspaceMembers = useWorkspaceMembers(type === 'workspace' ? targetId : undefined);
  const projectMembers = useProjectMembers(type === 'project' ? targetId : undefined);

  const updateWorkspaceRole = useUpdateWorkspaceMemberRole(targetId);
  const removeWorkspaceMember = useRemoveWorkspaceMember(targetId);
  const removeProjectMember = useRemoveProjectMember(targetId);

  const {
    data: members,
    isLoading,
    error,
  } = type === 'workspace' ? workspaceMembers : projectMembers;

  const currentUserMember = members?.find((m) => m.user.id === currentUser?.id);
  const isAdmin = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (type === 'workspace') {
      await updateWorkspaceRole.mutateAsync({ userId, role: newRole });
    }
    // Project member role update would go here if supported
  };

  const handleRemoveMember = async (userId: string) => {
    if (type === 'workspace') {
      await removeWorkspaceMember.mutateAsync(userId);
    } else {
      await removeProjectMember.mutateAsync(userId);
    }
    setConfirmRemove(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
        Failed to load members
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Members ({members?.length || 0})
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            People who have access to this {type}
          </p>
        </div>
        {isAdmin && onInvite && (
          <button
            onClick={onInvite}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Invite
          </button>
        )}
      </div>

      {/* Members list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {members && members.length > 0 ? (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              {/* Avatar */}
              <div className="relative">
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar}
                    alt={member.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-medium text-brand-600 dark:text-brand-400">
                    {getInitials(member.user.name)}
                  </div>
                )}
                {/* Status indicator */}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(member.user.status)}`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {member.user.name}
                  </span>
                  {member.user.id === currentUser?.id && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">(you)</span>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate block">
                  {member.user.email}
                </span>
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-2">
                {isAdmin && member.role !== 'owner' && member.user.id !== currentUser?.id ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer ${ROLE_COLORS[member.role]}`}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                  </select>
                ) : (
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg ${ROLE_COLORS[member.role]}`}
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                )}

                {/* Remove button */}
                {isAdmin && member.role !== 'owner' && member.user.id !== currentUser?.id && (
                  <div className="relative">
                    {confirmRemove === member.user.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(member.user.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove member"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No members yet</p>
            {isAdmin && onInvite && (
              <button
                onClick={onInvite}
                className="mt-2 text-brand-500 hover:text-brand-600 text-sm font-medium"
              >
                Invite your first member
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersList;
