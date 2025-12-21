// src/components/MemberManagementModal.tsx
import React, { useState } from 'react';
import { X, UserPlus, Mail, Crown, Shield, Users as UsersIcon, Eye, Trash2 } from 'lucide-react';
import {
  EntityType,
  useAddMember,
  useEffectiveMembers,
  useInviteMemberByEmail,
  useRemoveMember,
  useUpdateMemberRole,
} from '../../hooks/api/useMembers';

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  entityName: string;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner', icon: Crown, description: 'Full control' },
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Manage members & settings' },
  { value: 'lead', label: 'Lead', icon: UsersIcon, description: 'Add members to projects' },
  { value: 'member', label: 'Member', icon: UsersIcon, description: 'Work on tasks' },
  { value: 'viewer', label: 'Viewer', icon: Eye, description: 'Read-only access' },
];

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'invite'>('members');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');

  const { data: members, isLoading } = useEffectiveMembers(entityType, entityId, {
    enabled: isOpen,
  });
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();
  const inviteByEmail = useInviteMemberByEmail();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await inviteByEmail.mutateAsync({
        entityType,
        entityId,
        data: { email: email.trim(), role: selectedRole },
      });
      setEmail('');
      setSelectedRole('member');
      setActiveTab('members');
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMember.mutateAsync({ entityType, entityId, userId });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({
        entityType,
        entityId,
        userId,
        data: { role: newRole },
      });
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  if (!isOpen) return null;

  const directMembers = members?.filter((m) => !m.isInherited) || [];
  const inheritedMembers = members?.filter((m) => m.isInherited) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1d21] rounded-xl border border-[#2a2e33] w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2e33]">
          <div>
            <h2 className="text-xl font-semibold text-white">Manage Members</h2>
            <p className="text-sm text-[#6b7280] mt-1">
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)}: {entityName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2a2e33] text-[#6b7280] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2e33]">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'members' ? 'text-[#a78bfa]' : 'text-[#6b7280] hover:text-white'}`}
          >
            <span className="flex items-center justify-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Members ({members?.length || 0})
            </span>
            {activeTab === 'members' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'invite' ? 'text-[#a78bfa]' : 'text-[#6b7280] hover:text-white'}`}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invite
            </span>
            {activeTab === 'invite' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'members' ? (
            <div className="space-y-6">
              {/* Direct Members */}
              {directMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#9ca3af] mb-3">
                    Direct Members ({directMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {directMembers.map((member) => (
                      <MemberRow
                        key={member.userId}
                        member={member}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                        canEdit={!member.isInherited}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Inherited Members */}
              {inheritedMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#9ca3af] mb-3">
                    Inherited Members ({inheritedMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {inheritedMembers.map((member) => (
                      <MemberRow
                        key={member.userId}
                        member={member}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                        canEdit={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-[#2a2e33] rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {!isLoading && members?.length === 0 && (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-[#6b7280] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No members yet</p>
                  <button
                    onClick={() => setActiveTab('invite')}
                    className="mt-3 text-sm text-[#7c3aed] hover:text-[#a78bfa] font-medium"
                  >
                    Invite your first member
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#e5e7eb] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#25282c] border border-[#2a2e33] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e7eb] mb-2">Role</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                          ${
                            selectedRole === role.value
                              ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-white'
                              : 'bg-[#25282c] border-[#2a2e33] text-[#9ca3af] hover:bg-[#2a2e33] hover:text-white'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{role.label}</p>
                          <p className="text-xs text-[#6b7280]">{role.description}</p>
                        </div>
                        {selectedRole === role.value && (
                          <div className="w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={inviteByEmail.isPending}
                className="w-full px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteByEmail.isPending ? 'Sending Invite...' : 'Send Invite'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Member Row Component
interface MemberRowProps {
  member: any;
  onUpdateRole: (userId: string, role: string) => void;
  onRemove: (userId: string) => void;
  canEdit: boolean;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, onUpdateRole, onRemove, canEdit }) => {
  const [isEditing, setIsEditing] = useState(false);

  const getRoleIcon = (role: string) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return roleOption?.icon || UsersIcon;
  };

  const RoleIcon = getRoleIcon(member.role);

  return (
    <div className="flex items-center gap-3 p-3 bg-[#25282c] rounded-lg border border-[#2a2e33]">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
        {member.user?.avatar ? (
          <img
            src={member.user.avatar}
            alt={member.user.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          member.user?.name?.[0]?.toUpperCase() || 'U'
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.user?.name || 'Unknown'}</p>
        <p className="text-xs text-[#6b7280] truncate">{member.user?.email || ''}</p>
        {member.isInherited && (
          <p className="text-xs text-[#6b7280] mt-0.5">Inherited from {member.inheritedFrom}</p>
        )}
      </div>

      {/* Role */}
      <div className="flex items-center gap-2">
        {isEditing && canEdit ? (
          <select
            value={member.role}
            onChange={(e) => {
              onUpdateRole(member.userId, e.target.value);
              setIsEditing(false);
            }}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="px-3 py-1.5 bg-[#1a1d21] border border-[#2a2e33] rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={() => canEdit && setIsEditing(true)}
            disabled={!canEdit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm
              ${
                canEdit
                  ? 'bg-[#2a2e33] hover:bg-[#3a3e43] text-[#9ca3af] hover:text-white cursor-pointer'
                  : 'bg-[#2a2e33]/50 text-[#6b7280] cursor-not-allowed'
              } transition-colors`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span className="capitalize">{member.role}</span>
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => onRemove(member.userId)}
            className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
            title="Remove member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MemberManagementModal;
