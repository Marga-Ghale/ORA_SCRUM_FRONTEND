// src/pages/MembersManagementPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Crown,
  Shield,
  Eye,
  UserPlus,
  Search,
  Check,
  Info,
  Loader,
  ChevronDown,
  Trash2,
  Filter,
  AlertCircle,
} from 'lucide-react';
import {
  useAddMember,
  useEffectiveMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from '../../hooks/api/useMembers';
import { useSearchUsers } from '../../hooks/useUsers';
import { useWorkspace } from '../../hooks/api/useWorkspaces';
import { useSpace } from '../../hooks/api/useSpaces';
import { useFolder } from '../../hooks/api/useFolder';
import { useProject } from '../../hooks/api/useProjects';

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

const ENTITY_TYPE_LABELS: Record<string, { singular: string; icon: string; color: string }> = {
  workspace: { singular: 'Workspace', icon: '🏢', color: '#7c3aed' },
  space: { singular: 'Space', icon: '📁', color: '#60a5fa' },
  folder: { singular: 'Folder', icon: '📂', color: '#fbbf24' },
  project: { singular: 'Project', icon: '📋', color: '#ec4899' },
};

const MemberRow = ({
  member,
  onUpdateRole,
  onRemove,
  canEdit,
  getAccessBadge,
  showAccessInfo,
  setShowAccessInfo,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const accessBadge = getAccessBadge(member);
  const roleConfig = ROLE_OPTIONS.find((r) => r.value === member.role);
  const RoleIcon = roleConfig?.icon || Users;

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1d21] rounded-lg border border-gray-200 dark:border-[#2a2e33] hover:border-gray-300 dark:hover:border-[#3a3e43] transition-all">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {member.user?.name || 'Unknown'}
          </p>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accessBadge.color} flex items-center gap-1 cursor-help`}
            onMouseEnter={() => setShowAccessInfo(member.userId)}
            onMouseLeave={() => setShowAccessInfo(null)}
          >
            {accessBadge.icon && <accessBadge.icon className="w-2.5 h-2.5" />}
            {accessBadge.text}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-[#6b7280]">{member.user?.email || ''}</p>
        {member.isInherited && showAccessInfo === member.userId && (
          <div className="mt-2 text-xs text-gray-600 dark:text-[#9ca3af] bg-gray-100 dark:bg-[#25282c] px-3 py-2 rounded border border-gray-200 dark:border-[#2a2e33]">
            Access inherited from parent {member.inheritedFrom}. To modify, go to the{' '}
            {member.inheritedFrom} settings.
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isEditing && canEdit ? (
          <select
            value={member.role}
            onChange={(e) => {
              onUpdateRole(member.userId, e.target.value);
              setIsEditing(false);
            }}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="px-4 py-2 bg-gray-100 dark:bg-[#25282c] border border-gray-300 dark:border-[#2a2e33] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              canEdit
                ? 'bg-gray-100 dark:bg-[#25282c] hover:bg-gray-200 dark:hover:bg-[#2a2e33] text-gray-900 dark:text-white cursor-pointer'
                : 'bg-gray-100/50 dark:bg-[#25282c]/50 text-gray-400 dark:text-[#6b7280] cursor-not-allowed'
            } transition-colors`}
          >
            <RoleIcon className="w-4 h-4" style={{ color: roleConfig?.color }} />
            <span className="capitalize">{member.role}</span>
            {canEdit && <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => onRemove(member.userId, member.user?.name || 'this member')}
            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Remove member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const AddMemberSection = ({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  selectedUsers,
  toggleUserSelection,
  availableUsers,
  searchLoading,
  handleAddMembers,
  addMemberLoading,
}: any) => {
  return (
    <div className="bg-white dark:bg-[#1a1d21] rounded-xl border border-gray-200 dark:border-[#2a2e33] p-6 space-y-6 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Members</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e7eb] mb-2">
            Search Users
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#25282c] border border-gray-300 dark:border-[#2a2e33] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
            {searchLoading && (
              <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#6b7280] animate-spin" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-[#6b7280] mt-2">
            Type at least 2 characters to search
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e7eb] mb-2">
            Select Role
          </label>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    selectedRole === role.value
                      ? 'bg-purple-50 dark:bg-[#7c3aed]/10 border-purple-500 dark:border-[#7c3aed] text-gray-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-[#25282c] border-gray-300 dark:border-[#2a2e33] text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#2a2e33]'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ color: role.color }} />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium">{role.label}</p>
                    <p className="text-[10px] text-gray-500 dark:text-[#6b7280]">
                      {role.description}
                    </p>
                  </div>
                  {selectedRole === role.value && (
                    <Check className="w-4 h-4 text-purple-600 dark:text-[#7c3aed]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {searchQuery.length >= 2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e7eb] mb-2">
              Available Users ({selectedUsers.size} selected)
            </label>
            <div className="border border-gray-300 dark:border-[#2a2e33] rounded-lg overflow-hidden max-h-80">
              {searchLoading ? (
                <div className="p-8 text-center">
                  <Loader className="w-6 h-6 text-gray-400 dark:text-[#6b7280] animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-[#6b7280]">Searching...</p>
                </div>
              ) : availableUsers.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-[#2a2e33] overflow-y-auto max-h-80">
                  {availableUsers.map((user: any) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#25282c] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-[#2a2e33] bg-white dark:bg-[#25282c] text-[#7c3aed]"
                      />
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-xs font-semibold">
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
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-[#6b7280] truncate">
                          {user.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 text-gray-400 dark:text-[#6b7280] mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-[#9ca3af]">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleAddMembers}
          disabled={selectedUsers.size === 0 || addMemberLoading}
          className="w-full px-4 py-3 bg-purple-600 dark:bg-[#7c3aed] hover:bg-purple-700 dark:hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {addMemberLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Adding Members...
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
    </div>
  );
};

export default function MembersManagementPage() {
  const { entityType, entityId } = useParams<{
    entityType: 'workspace' | 'space' | 'folder' | 'project';
    entityId: string;
  }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedUsers, setSelectedUsers] = useState(new Set<string>());
  const [showAccessInfo, setShowAccessInfo] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'inherited'>('all');

  // ✅ DEBUG: Log params
  useEffect(() => {
    console.log('🔍 MembersManagementPage - Params:', { entityType, entityId });
  }, [entityType, entityId]);

  // ✅ FIX: Proper enabled condition with debug logging
  const {
    data: members = [],
    isLoading: membersLoading,
    error: membersError,
    isError: hasMembersError,
  } = useEffectiveMembers(entityType!, entityId!, {
    enabled: Boolean(entityType && entityId),
  });

  // ✅ DEBUG: Log members data
  useEffect(() => {
    console.log('👥 Members Data:', {
      members,
      count: members.length,
      loading: membersLoading,
      error: membersError,
      hasError: hasMembersError,
    });
  }, [members, membersLoading, membersError, hasMembersError]);

  const { data: searchResults = [], isLoading: searchLoading } = useSearchUsers(searchQuery, {
    enabled: searchQuery.length >= 2,
  });

  const addMember = useAddMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  // ✅ FIX: Fetch entity details with proper conditions
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(entityId!, {
    enabled: entityType === 'workspace' && Boolean(entityId),
  });

  const { data: space, isLoading: spaceLoading } = useSpace(entityId!, {
    enabled: entityType === 'space' && Boolean(entityId),
  });

  const { data: folder, isLoading: folderLoading } = useFolder(entityId!, {
    enabled: entityType === 'folder' && Boolean(entityId),
  });

  const { data: project, isLoading: projectLoading } = useProject(entityId!, {
    enabled: entityType === 'project' && Boolean(entityId),
  });

  const entityData =
    entityType === 'workspace'
      ? workspace
      : entityType === 'space'
        ? space
        : entityType === 'folder'
          ? folder
          : project;

  const entityLoading =
    entityType === 'workspace'
      ? workspaceLoading
      : entityType === 'space'
        ? spaceLoading
        : entityType === 'folder'
          ? folderLoading
          : projectLoading;

  const entityName = entityData?.name || 'Loading...';

  const directMembers = members.filter((m: any) => !m.isInherited);
  const inheritedMembers = members.filter((m: any) => m.isInherited);

  const filteredMembers =
    filterType === 'all' ? members : filterType === 'direct' ? directMembers : inheritedMembers;

  const memberUserIds = new Set(members.map((m: any) => m.userId));
  const availableUsers = searchResults.filter((user: any) => !memberUserIds.has(user.id));

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0 || !entityType || !entityId) return;

    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        addMember.mutateAsync({
          entityType,
          entityId,
          data: { userId, role: selectedRole },
        })
      );

      await Promise.all(promises);
      setSelectedUsers(new Set());
      setSearchQuery('');
    } catch (error: any) {
      console.error('❌ Failed to add members:', error);
      alert(`Failed to add members: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!entityType || !entityId) return;
    if (!confirm(`Remove ${userName} from this ${entityType}?`)) return;

    try {
      await removeMember.mutateAsync({ entityType, entityId, userId });
    } catch (error: any) {
      console.error('❌ Failed to remove member:', error);
      alert(`Failed to remove member: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!entityType || !entityId) return;

    try {
      await updateRole.mutateAsync({
        entityType,
        entityId,
        userId,
        data: { role: newRole },
      });
    } catch (error: any) {
      console.error('❌ Failed to update role:', error);
      alert(`Failed to update role: ${error?.message || 'Unknown error'}`);
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

  const entityConfig = entityType
    ? ENTITY_TYPE_LABELS[entityType]
    : { singular: 'Entity', icon: '📁', color: '#7c3aed' };

  // ✅ ERROR STATE - Show if members API fails
  if (hasMembersError) {
    return (
      <div className="min-h-screen bg-[#111315] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-[#1a1d21] rounded-xl border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Failed to Load Members</h2>
          <p className="text-sm text-[#9ca3af] mb-4">
            {membersError instanceof Error ? membersError.message : 'Unknown error occurred'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-4 py-2 bg-[#25282c] hover:bg-[#2a2e33] text-white rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
          <div className="mt-4 p-3 bg-[#25282c] rounded-lg text-left">
            <p className="text-xs text-[#6b7280] font-mono">
              Debug Info:
              <br />
              Entity: {entityType} / {entityId}
              <br />
              Error: {membersError instanceof Error ? membersError.message : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ LOADING STATE - Show while fetching entity or members
  if (entityLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-[#111315] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#7c3aed] animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">
            {entityLoading ? 'Loading entity details...' : 'Loading members...'}
          </p>
          <p className="text-xs text-[#6b7280] mt-1">
            {entityType} / {entityId}
          </p>
        </div>
      </div>
    );
  }

  // ✅ INVALID PARAMS - Show if params are missing
  if (!entityType || !entityId) {
    return (
      <div className="min-h-screen bg-[#111315] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-[#1a1d21] rounded-xl border border-[#2a2e33]">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Invalid URL</h2>
          <p className="text-sm text-[#9ca3af] mb-4">
            Missing entity type or ID in the URL parameters.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111315]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d21] border-b border-gray-200 dark:border-[#2a2e33] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#25282c] text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${entityConfig.color}20` }}
                >
                  {entityConfig.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {entityName}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-[#6b7280]">
                    {entityConfig.singular} Members Management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className=" mx-auto  py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Member List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Card */}
            <div className="bg-white dark:bg-[#1a1d21] rounded-xl border border-gray-200 dark:border-[#2a2e33] p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 dark:text-[#60a5fa] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Access Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-100 dark:bg-[#25282c] rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {members.length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-[#6b7280] mt-1">
                        Total Members
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-100 dark:bg-[#25282c] rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {directMembers.length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-[#6b7280] mt-1">Direct</p>
                    </div>
                    <div className="text-center p-3 bg-gray-100 dark:bg-[#25282c] rounded-lg">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {inheritedMembers.length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-[#6b7280] mt-1">Inherited</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-[#6b7280]" />
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-600 dark:bg-[#7c3aed] text-white'
                    : 'bg-gray-100 dark:bg-[#25282c] text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All ({members.length})
              </button>
              <button
                onClick={() => setFilterType('direct')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'direct'
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-[#25282c] text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Direct ({directMembers.length})
              </button>
              <button
                onClick={() => setFilterType('inherited')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'inherited'
                    ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                    : 'bg-gray-100 dark:bg-[#25282c] text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Inherited ({inheritedMembers.length})
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-3">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    onUpdateRole={handleUpdateRole}
                    onRemove={handleRemoveMember}
                    canEdit={!member.isInherited}
                    getAccessBadge={getAccessBadge}
                    showAccessInfo={showAccessInfo}
                    setShowAccessInfo={setShowAccessInfo}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-white dark:bg-[#1a1d21] rounded-xl border border-gray-200 dark:border-[#2a2e33]">
                  <Users className="w-12 h-12 text-gray-400 dark:text-[#6b7280] mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-[#9ca3af]">No members found</p>
                  <p className="text-xs text-gray-500 dark:text-[#6b7280] mt-1">
                    {filterType === 'direct' && 'No direct members yet'}
                    {filterType === 'inherited' && 'No inherited members'}
                    {filterType === 'all' && 'Add members to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Add Members */}
          <div className="lg:col-span-1">
            <AddMemberSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              selectedUsers={selectedUsers}
              toggleUserSelection={toggleUserSelection}
              availableUsers={availableUsers}
              searchLoading={false}
              handleAddMembers={handleAddMembers}
              addMemberLoading={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
