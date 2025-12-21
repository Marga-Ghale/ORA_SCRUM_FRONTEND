// src/components/modals/MemberManagementModal.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  UserPlus,
  Crown,
  Shield,
  Users,
  Eye,
  Trash2,
  Search,
  Check,
  AlertCircle,
  Loader,
  ChevronDown,
  Info,
} from 'lucide-react';
import { EntityType } from '../../hooks/api/useMembers';

const ROLE_OPTIONS = [
  {
    value: 'owner',
    label: 'Owner',
    icon: Crown,
    description: 'Full control, can delete',
    level: 5,
    color: '#fbbf24',
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: Shield,
    description: 'Manage members & settings',
    level: 4,
    color: '#a78bfa',
  },
  {
    value: 'lead',
    label: 'Lead',
    icon: Users,
    description: 'Add members to projects',
    level: 3,
    color: '#60a5fa',
  },
  {
    value: 'member',
    label: 'Member',
    icon: Users,
    description: 'Work on tasks',
    level: 2,
    color: '#34d399',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    icon: Eye,
    description: 'Read-only access',
    level: 1,
    color: '#9ca3af',
  },
];

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  useEffectiveMembers: any;
  useSearchUsers: any;
  useAddMember: any;
  useUpdateMemberRole: any;
  useRemoveMember: any;
}

interface MemberRowProps {
  member: any;
  onUpdateRole: (userId: string, role: string) => void;
  onRemove: (userId: string, userName: string) => void;
  canEdit: boolean;
  getAccessBadge: (member: any) => any;
  showAccessInfo: string | null;
  setShowAccessInfo: (userId: string | null) => void;
}

const MemberRow: React.FC<MemberRowProps> = ({
  member,
  onUpdateRole,
  onRemove,
  canEdit,
  getAccessBadge,
  showAccessInfo,
  setShowAccessInfo,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const accessBadge = getAccessBadge(member);
  const roleConfig = ROLE_OPTIONS.find((r) => r.value === member.role);
  const RoleIcon = roleConfig?.icon || Users;

  return (
    <div className="flex items-center gap-3 p-3 bg-[#25282c] rounded-lg border border-[#2a2e33] hover:border-[#3a3e43] transition-colors">
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
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-[#6b7280] truncate">{member.user?.email || ''}</p>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accessBadge.color} flex items-center gap-1 cursor-help`}
            onMouseEnter={() => setShowAccessInfo(member.userId)}
            onMouseLeave={() => setShowAccessInfo(null)}
          >
            {accessBadge.icon && <accessBadge.icon className="w-2.5 h-2.5" />}
            {accessBadge.text}
          </span>
        </div>
        {member.isInherited && showAccessInfo === member.userId && (
          <div className="mt-1 text-xs text-[#9ca3af] bg-[#1a1d21] px-2 py-1 rounded">
            Access inherited from parent {member.inheritedFrom}. Cannot modify here.
          </div>
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
            <RoleIcon className="w-3.5 h-3.5" style={{ color: roleConfig?.color }} />
            <span className="capitalize">{member.role}</span>
            {canEdit && <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => onRemove(member.userId, member.user?.name || 'this member')}
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

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  useEffectiveMembers,
  useSearchUsers,
  useAddMember,
  useUpdateMemberRole,
  useRemoveMember,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedUsers, setSelectedUsers] = useState(new Set<string>());
  const [showAccessInfo, setShowAccessInfo] = useState<string | null>(null);

  const { data: members = [], isLoading: membersLoading } = useEffectiveMembers(
    entityType,
    entityId,
    { enabled: isOpen }
  );

  const { data: searchResults = [], isLoading: searchLoading } = useSearchUsers(searchQuery, {
    enabled: searchQuery.length >= 2,
  });

  const addMember = useAddMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const { directMembers, inheritedMembers } = useMemo(() => {
    const direct = members.filter((m: any) => !m.isInherited);
    const inherited = members.filter((m: any) => m.isInherited);
    return { directMembers: direct, inheritedMembers: inherited };
  }, [members]);

  const memberUserIds = useMemo(() => new Set(members.map((m: any) => m.userId)), [members]);

  const availableUsers = useMemo(() => {
    return searchResults.filter((user: any) => !memberUserIds.has(user.id));
  }, [searchResults, memberUserIds]);

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0) return;

    try {
      for (const userId of selectedUsers) {
        await addMember.mutateAsync({
          entityType,
          entityId,
          data: { userId, role: selectedRole },
        });
      }
      setSelectedUsers(new Set());
      setSearchQuery('');
      setActiveTab('members');
    } catch (error) {
      console.error('Failed to add members:', error);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this ${entityType}?`)) return;

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

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const getAccessBadge = (member: any) => {
    if (!member.isInherited) {
      return { text: 'Direct', color: 'bg-green-500/20 text-green-400', icon: Check };
    }

    const sourceMap: Record<string, any> = {
      workspace: { text: 'From Workspace', color: 'bg-purple-500/20 text-purple-400' },
      space: { text: 'From Space', color: 'bg-blue-500/20 text-blue-400' },
      folder: { text: 'From Folder', color: 'bg-yellow-500/20 text-yellow-400' },
    };

    return (
      sourceMap[member.inheritedFrom] || {
        text: 'Inherited',
        color: 'bg-gray-500/20 text-gray-400',
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-[#2a2e33] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2e33]">
          <div>
            <h2 className="text-xl font-semibold text-white">Manage Members</h2>
            <p className="text-sm text-[#6b7280] mt-1">
              <span className="capitalize">{entityType}</span>: {entityName}
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
              <Users className="w-4 h-4" />
              Members ({members.length})
            </span>
            {activeTab === 'members' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'add' ? 'text-[#a78bfa]' : 'text-[#6b7280] hover:text-white'}`}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Members
            </span>
            {activeTab === 'add' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'members' ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-[#25282c] rounded-lg p-4 border border-[#2a2e33]">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#60a5fa] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Access Overview</h3>
                    <p className="text-xs text-[#9ca3af] leading-relaxed">
                      <span className="text-green-400 font-medium">
                        {directMembers.length} direct
                      </span>{' '}
                      members have been explicitly added.
                      <span className="text-purple-400 font-medium ml-1">
                        {inheritedMembers.length} inherited
                      </span>{' '}
                      members have access through parent hierarchy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Members */}
              {directMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#e5e7eb] mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Direct Members ({directMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {directMembers.map((member: any) => (
                      <MemberRow
                        key={member.userId}
                        member={member}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                        canEdit={true}
                        getAccessBadge={getAccessBadge}
                        showAccessInfo={showAccessInfo}
                        setShowAccessInfo={setShowAccessInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Inherited Members */}
              {inheritedMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#e5e7eb] mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-400" />
                    Inherited Members ({inheritedMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {inheritedMembers.map((member: any) => (
                      <MemberRow
                        key={member.userId}
                        member={member}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                        canEdit={false}
                        getAccessBadge={getAccessBadge}
                        showAccessInfo={showAccessInfo}
                        setShowAccessInfo={setShowAccessInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {membersLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-[#25282c] rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!membersLoading && members.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[#6b7280] mx-auto mb-3" />
                  <p className="text-sm text-[#9ca3af] mb-1">No members yet</p>
                  <p className="text-xs text-[#6b7280] mb-4">Start building your team</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    Add First Member
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-[#e5e7eb] mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#25282c] border border-[#2a2e33] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  />
                  {searchLoading && (
                    <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280] animate-spin" />
                  )}
                </div>
                <p className="text-xs text-[#6b7280] mt-1.5">
                  Type at least 2 characters to search
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-[#e5e7eb] mb-2">Select Role</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                          ${
                            selectedRole === role.value
                              ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-white'
                              : 'bg-[#25282c] border-[#2a2e33] text-[#9ca3af] hover:bg-[#2a2e33] hover:text-white'
                          }`}
                      >
                        <Icon className="w-5 h-5" style={{ color: role.color }} />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{role.label}</p>
                          <p className="text-xs text-[#6b7280]">{role.description}</p>
                        </div>
                        {selectedRole === role.value && (
                          <div className="w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div>
                  <label className="block text-sm font-medium text-[#e5e7eb] mb-2">
                    Available Users ({selectedUsers.size} selected)
                  </label>
                  <div className="border border-[#2a2e33] rounded-lg overflow-hidden">
                    {searchLoading ? (
                      <div className="p-8 text-center">
                        <Loader className="w-6 h-6 text-[#6b7280] animate-spin mx-auto mb-2" />
                        <p className="text-sm text-[#6b7280]">Searching...</p>
                      </div>
                    ) : availableUsers.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {availableUsers.map((user: any) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 p-3 hover:bg-[#25282c] cursor-pointer transition-colors border-b border-[#2a2e33] last:border-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="w-4 h-4 rounded border-[#2a2e33] bg-[#25282c] text-[#7c3aed]"
                            />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                user.name?.[0]?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{user.name}</p>
                              <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Search className="w-8 h-8 text-[#6b7280] mx-auto mb-2" />
                        <p className="text-sm text-[#9ca3af]">No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddMembers}
                disabled={selectedUsers.size === 0 || addMember.isPending}
                className="w-full px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addMember.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add {selectedUsers.size > 0 ? `${selectedUsers.size} ` : ''}Member
                    {selectedUsers.size !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManagementModal;
