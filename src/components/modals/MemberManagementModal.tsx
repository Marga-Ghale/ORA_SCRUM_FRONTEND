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
  Building2,
  FolderTree,
  Layers,
} from 'lucide-react';
import { EntityType } from '../../hooks/api/useMembers';
import { MemberActionModal, useMemberActionModal } from './MemberActionModal';

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

// ✅ CORRECT
interface MemberRowProps {
  member: any;
  onUpdateRole: (userId: string, newRole: string, userName: string, currentRole: string) => void; // ← 4 parameters
  onRemove: (userId: string, userName: string) => void;
  canEdit: boolean;
  accessBadge: { text: string; color: string; icon?: any };
  showAccessInfo: string | null;
  setShowAccessInfo: (userId: string | null) => void;
  showInheritedTooltip?: boolean;
}

const MemberRow: React.FC<MemberRowProps> = ({
  member,
  onUpdateRole,
  onRemove,
  canEdit,
  accessBadge,
  showAccessInfo,
  setShowAccessInfo,
  showInheritedTooltip = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const roleConfig = ROLE_OPTIONS.find((r) => r.value === member.role);
  const RoleIcon = roleConfig?.icon || Users;

  return (
    <div className="flex items-center gap-3 p-3 bg-[#25282c] z-50 rounded-lg border border-[#2a2e33] hover:border-[#3a3e43] transition-colors">
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
        {showInheritedTooltip && showAccessInfo === member.userId && (
          <div className="mt-1 text-xs text-[#9ca3af] bg-[#1a1d21] px-2 py-1 rounded">
            Access inherited from {member.inheritedFrom}. Manage in parent entity.
          </div>
        )}
      </div>

      {/* Role */}
      <div className="flex items-center gap-2">
        {isEditing && canEdit ? (
          <select
            value={member.role}
            onChange={(e) => {
              onUpdateRole(
                member.userId,
                e.target.value,
                member.user?.name || 'Unknown',
                member.role
              );
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

// Selected user chip component for bulk selection preview
interface SelectedUserChipProps {
  user: any;
  onRemove: () => void;
}

const SelectedUserChip: React.FC<SelectedUserChipProps> = ({ user, onRemove }) => (
  <div className="flex items-center gap-2 px-2 py-1 bg-[#7c3aed]/20 border border-[#7c3aed]/40 rounded-full">
    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-[10px] font-semibold">
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
    <span className="text-xs text-white truncate max-w-[100px]">{user.name}</span>
    <button
      onClick={onRemove}
      className="p-0.5 hover:bg-[#7c3aed]/30 rounded-full transition-colors"
    >
      <X className="w-3 h-3 text-[#a78bfa]" />
    </button>
  </div>
);

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
  const [selectedUsers, setSelectedUsers] = useState<Map<string, any>>(new Map());
  const [showAccessInfo, setShowAccessInfo] = useState<string | null>(null);

  // ✅ ADD THIS - Modal management
  const { modalState, openModal, closeModal } = useMemberActionModal();

  // Fetch effective members
  const { data: members = [], isLoading: membersLoading } = useEffectiveMembers(
    entityType,
    entityId,
    { enabled: isOpen }
  );

  // Categorize members into direct, inherited, and visible-only
  const categorizedMembers = useMemo(() => {
    const direct: any[] = [];
    const inherited: any[] = [];
    const visibleOnly: any[] = [];

    members.forEach((m: any) => {
      if (!m.isInherited) {
        // Direct member - explicitly added to this entity
        direct.push(m);
      } else if (entityType === 'space' && m.inheritedFrom === 'workspace') {
        // Workspace members viewing a space - they can see but not edit
        // This is "visible only" access - they see the space in sidebar but aren't members
        visibleOnly.push(m);
      } else {
        // Real inherited access (e.g., space members in folder, folder members in project)
        inherited.push(m);
      }
    });

    return { direct, inherited, visibleOnly };
  }, [members, entityType]);

  // Search users
  const { data: searchResults = [], isLoading: searchLoading } = useSearchUsers(searchQuery, {
    enabled: searchQuery.length >= 2,
  });

  // Mutations
  const addMember = useAddMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  // Get IDs of users who already have access
  const existingMemberIds = useMemo(() => new Set(members.map((m: any) => m.userId)), [members]);

  // Filter search results to exclude existing members
  const availableUsers = useMemo(() => {
    return searchResults.filter((user: any) => !existingMemberIds.has(user.id));
  }, [searchResults, existingMemberIds]);

  // Handle adding multiple members
  const handleAddMembers = () => {
    if (selectedUsers.size === 0) return;

    openModal('add', {
      memberCount: selectedUsers.size,
      newRole: selectedRole,
      onConfirm: async () => {
        const userIds = Array.from(selectedUsers.keys());
        for (const userId of userIds) {
          await addMember.mutateAsync({
            entityType,
            entityId,
            data: { userId, role: selectedRole },
          });
        }
        setSelectedUsers(new Map());
        setSearchQuery('');
        setActiveTab('members');
      },
    });
  };

  // Handle removing a member
  const handleRemoveMember = (userId: string, userName: string) => {
    openModal('remove', {
      memberName: userName,
      onConfirm: async () => {
        await removeMember.mutateAsync({ entityType, entityId, userId });
      },
    });
  };

  // Handle updating a member's role
  const handleUpdateRole = (
    userId: string,
    newRole: string,
    userName: string,
    currentRole: string
  ) => {
    openModal('updateRole', {
      memberName: userName,
      currentRole: currentRole,
      newRole: newRole,
      onConfirm: async () => {
        await updateRole.mutateAsync({
          entityType,
          entityId,
          userId,
          data: { role: newRole },
        });
      },
    });
  };

  // Toggle user selection for bulk add
  const toggleUserSelection = (user: any) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.set(user.id, user);
      }
      return next;
    });
  };

  // Remove user from selection
  const removeFromSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  };

  // Get access badge configuration based on member type
  const getAccessBadge = (member: any, category: 'direct' | 'inherited' | 'visibleOnly') => {
    if (category === 'direct') {
      return { text: 'Direct', color: 'bg-green-500/20 text-green-400', icon: Check };
    }

    if (category === 'visibleOnly') {
      return { text: 'Workspace Member', color: 'bg-gray-500/20 text-gray-400', icon: Building2 };
    }

    // Inherited - show source
    const sourceMap: Record<string, any> = {
      workspace: {
        text: 'From Workspace',
        color: 'bg-purple-500/20 text-purple-400',
        icon: Building2,
      },
      space: { text: 'From Space', color: 'bg-blue-500/20 text-blue-400', icon: Layers },
      folder: { text: 'From Folder', color: 'bg-yellow-500/20 text-yellow-400', icon: FolderTree },
    };

    return (
      sourceMap[member.inheritedFrom] || {
        text: 'Inherited',
        color: 'bg-gray-500/20 text-gray-400',
      }
    );
  };

  // Get entity type label
  const getEntityLabel = (type: EntityType) => {
    const labels: Record<EntityType, string> = {
      workspace: 'Workspace',
      space: 'Space',
      folder: 'Folder',
      project: 'Project',
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  const { direct, inherited, visibleOnly } = categorizedMembers;
  const totalMembers = direct.length + inherited.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-[#2a2e33] w-full max-w-3xl max-h-[90vh] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2e33]">
          <div>
            <h2 className="text-xl font-semibold text-white">Manage Members</h2>
            <p className="text-sm text-[#6b7280] mt-1">
              {getEntityLabel(entityType)}: {entityName}
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
              Members ({totalMembers})
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
              {selectedUsers.size > 0 && (
                <span className="px-1.5 py-0.5 bg-[#7c3aed] text-white text-xs rounded-full">
                  {selectedUsers.size}
                </span>
              )}
            </span>
            {activeTab === 'add' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto  p-6">
          {activeTab === 'members' ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-[#25282c] rounded-lg p-4 border border-[#2a2e33]">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#60a5fa] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Access Overview</h3>
                    <p className="text-xs text-[#9ca3af] leading-relaxed">
                      <span className="text-green-400 font-medium">{direct.length} direct</span>{' '}
                      member{direct.length !== 1 ? 's' : ''} explicitly added to this {entityType}.
                      {inherited.length > 0 && (
                        <>
                          {' '}
                          <span className="text-blue-400 font-medium">
                            {inherited.length} inherited
                          </span>{' '}
                          member{inherited.length !== 1 ? 's' : ''} from parent hierarchy.
                        </>
                      )}
                      {visibleOnly.length > 0 && (
                        <>
                          {' '}
                          <span className="text-gray-400 font-medium">
                            {visibleOnly.length} workspace
                          </span>{' '}
                          member{visibleOnly.length !== 1 ? 's' : ''} can view but aren't{' '}
                          {entityType} members.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Members */}
              {direct.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#e5e7eb] mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Direct Members ({direct.length})
                  </h3>
                  <div className="space-y-2">
                    {direct.map((member: any) => (
                      <MemberRow
                        key={member.userId}
                        member={member}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                        canEdit={true}
                        accessBadge={getAccessBadge(member, 'direct')}
                        showAccessInfo={showAccessInfo}
                        setShowAccessInfo={setShowAccessInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Inherited Members */}
              {inherited.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#e5e7eb] mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    Inherited Members ({inherited.length})
                    <span className="text-xs text-[#6b7280] font-normal ml-1">
                      — manage in parent entity
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {inherited.map((member: any) => (
                      <MemberRow
                        key={member.userId}
                        member={member}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                        canEdit={false}
                        accessBadge={getAccessBadge(member, 'inherited')}
                        showAccessInfo={showAccessInfo}
                        setShowAccessInfo={setShowAccessInfo}
                        showInheritedTooltip={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Visible Only (Workspace members in Space view) */}
              {visibleOnly.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#e5e7eb] mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    Workspace Members ({visibleOnly.length})
                    <span className="text-xs text-[#6b7280] font-normal ml-1">
                      — can view, not {entityType} members
                    </span>
                  </h3>
                  <p className="text-xs text-[#6b7280] mb-3 bg-[#1a1d21] p-2 rounded border border-[#2a2e33]">
                    These users are workspace members who can see this {entityType} in the sidebar,
                    but they're not members of this {entityType}. Add them as direct members to
                    grant full access.
                  </p>
                  <div className="space-y-2">
                    {visibleOnly.map((member: any) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-3 bg-[#25282c]/50 rounded-lg border border-[#2a2e33] opacity-75"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6b7280] to-[#4b5563] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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
                          <p className="text-sm font-medium text-[#9ca3af] truncate">
                            {member.user?.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-[#6b7280] truncate">
                              {member.user?.email || ''}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-500/20 text-gray-400 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              Workspace Only
                            </span>
                          </div>
                        </div>

                        {/* Quick Add Button */}
                        <button
                          onClick={() => {
                            setSelectedUsers(new Map([[member.userId, member.user]]));
                            setActiveTab('add');
                          }}
                          className="px-3 py-1.5 text-xs bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30 text-[#a78bfa] rounded-md transition-colors flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          Add to {getEntityLabel(entityType)}
                        </button>
                      </div>
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
                  <p className="text-xs text-[#6b7280] mb-4">
                    Start building your team by adding members
                  </p>
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
              {/* Selected Users Preview */}
              {selectedUsers.size > 0 && (
                <div className="bg-[#25282c] rounded-lg p-4 border border-[#7c3aed]/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#7c3aed]" />
                      Selected Users ({selectedUsers.size})
                    </h4>
                    <button
                      onClick={() => setSelectedUsers(new Map())}
                      className="text-xs text-[#6b7280] hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedUsers.entries()).map(([userId, user]) => (
                      <SelectedUserChip
                        key={userId}
                        user={user}
                        onRemove={() => removeFromSelection(userId)}
                      />
                    ))}
                  </div>
                </div>
              )}

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
                <label className="block text-sm font-medium text-[#e5e7eb] mb-2">
                  Role for new members
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all
                          ${
                            selectedRole === role.value
                              ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-white'
                              : 'bg-[#25282c] border-[#2a2e33] text-[#9ca3af] hover:bg-[#2a2e33] hover:text-white'
                          }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" style={{ color: role.color }} />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium">{role.label}</p>
                          <p className="text-xs text-[#6b7280] truncate">{role.description}</p>
                        </div>
                        {selectedRole === role.value && (
                          <div className="w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
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
                    Available Users
                  </label>
                  <div className="border border-[#2a2e33] rounded-lg overflow-hidden">
                    {searchLoading ? (
                      <div className="p-8 text-center">
                        <Loader className="w-6 h-6 text-[#6b7280] animate-spin mx-auto mb-2" />
                        <p className="text-sm text-[#6b7280]">Searching...</p>
                      </div>
                    ) : availableUsers.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {availableUsers.map((user: any) => {
                          const isSelected = selectedUsers.has(user.id);
                          return (
                            <button
                              key={user.id}
                              onClick={() => toggleUserSelection(user)}
                              className={`w-full flex items-center gap-3 p-3 transition-colors border-b border-[#2a2e33] last:border-0
                                ${isSelected ? 'bg-[#7c3aed]/10' : 'hover:bg-[#25282c]'}`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                                ${
                                  isSelected
                                    ? 'bg-[#7c3aed] border-[#7c3aed]'
                                    : 'border-[#4b5563] bg-transparent'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
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
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-white truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                              </div>
                              {isSelected && (
                                <span className="text-xs text-[#a78bfa] font-medium">Selected</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Search className="w-8 h-8 text-[#6b7280] mx-auto mb-2" />
                        <p className="text-sm text-[#9ca3af]">No users found</p>
                        <p className="text-xs text-[#6b7280] mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddMembers}
                  disabled={selectedUsers.size === 0 || addMember.isPending}
                  className="w-full px-4 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addMember.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding {selectedUsers.size} member{selectedUsers.size !== 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add {selectedUsers.size > 0 ? `${selectedUsers.size} ` : ''}
                      Member{selectedUsers.size !== 1 ? 's' : ''} as{' '}
                      {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}
                    </>
                  )}
                </button>
                {selectedUsers.size > 0 && (
                  <p className="text-xs text-[#6b7280] text-center mt-2">
                    {Array.from(selectedUsers.values())
                      .map((u) => u.name)
                      .join(', ')}{' '}
                    will be added as {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <MemberActionModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          actionType={modalState.actionType}
          entityType={entityType}
          memberName={modalState.memberName}
          currentRole={modalState.currentRole}
          newRole={modalState.newRole}
          memberCount={modalState.memberCount}
          onConfirm={modalState.onConfirm || (async () => {})}
        />
      </div>
    </div>
  );
};

export default MemberManagementModal;
