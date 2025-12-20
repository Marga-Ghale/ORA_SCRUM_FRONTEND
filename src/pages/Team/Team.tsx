// src/pages/Team/Team.tsx
import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  MessageCircle,
  Users as UsersIcon,
  Mail,
  Shield,
  X,
  Filter,
  Download,
  Upload,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import PageMeta from '../../components/common/PageMeta';
import {
  useEffectiveMembers,
  useDirectMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from '../../hooks/api/useMembers';
import { useCurrentUser } from '../../hooks/api/useAuth';

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  isInherited: boolean;
  inheritedFrom?: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  tasksCount: number;
  currentUserId?: string;
  onViewProfile: () => void;
  onUpdateRole: (newRole: string) => void;
  onRemove: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  tasksCount,
  currentUserId,
  onViewProfile,
  onUpdateRole,
  onRemove,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors = {
    online: '#10B981',
    busy: '#F59E0B',
    away: '#6B7280',
    offline: '#D1D5DB',
  };

  const roleColors = {
    admin: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
    member: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    viewer: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };

  const isCurrentUser = member.userId === currentUserId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 relative">
      {/* Inherited Badge */}
      {member.isInherited && (
        <div className="absolute top-4 right-4">
          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full font-medium">
            Inherited
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xl font-bold text-white ring-2 ring-white dark:ring-gray-800">
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
          )}
          <span
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
            style={{ backgroundColor: statusColors[member.status] }}
            title={member.status}
          />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
              roleColors[member.role as keyof typeof roleColors] || roleColors.member
            }`}
          >
            {member.role}
          </span>
          {isCurrentUser && (
            <span className="px-2 py-1 bg-brand-500 text-white text-xs font-medium rounded-full">
              You
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{member.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
        <Mail className="w-3.5 h-3.5" />
        {member.email}
      </p>

      {member.inheritedFrom && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
          Inherited from: {member.inheritedFrom}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasksCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Assigned tasks</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onViewProfile}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            View Profile
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Send message"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          {!member.isInherited && !isCurrentUser && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onUpdateRole(member.role === 'admin' ? 'member' : 'admin');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      {member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => {
                        onRemove();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove Member
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Team: React.FC = () => {
  const { tasks, currentWorkspace, currentProject } = useProject();

  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);

  // Get current user
  const { data: currentUser } = useCurrentUser();

  // Fetch project members (effective = direct + inherited)
  const { data: projectMembers, isLoading } = useEffectiveMembers(
    'project',
    currentProject?.id || '',
    { enabled: !!currentProject?.id }
  );

  // Fetch direct members only (for actions)
  const { data: directMembers } = useDirectMembers('project', currentProject?.id || '', {
    enabled: !!currentProject?.id,
  });

  // Mutations
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  // Map members with their user data (includes status)
  const users = useMemo<TeamMember[]>(() => {
    if (!projectMembers) return [];

    return projectMembers.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user?.name || 'Unknown',
      email: member.user?.email || '',
      avatar: member.user?.avatar,
      role: member.role,
      status: (member.user?.status as 'online' | 'offline' | 'away' | 'busy') || 'offline',
      isInherited: member.isInherited,
      inheritedFrom: member.inheritedFrom,
    }));
  }, [projectMembers]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredMembers = useMemo(() => {
    return users.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const getTasksForMember = (memberId: string) => {
    return tasks.filter((t) => t.assignees?.includes(memberId as any)).length;
  };

  const statusStats = useMemo(
    () => ({
      online: users.filter((u) => u.status === 'online').length,
      busy: users.filter((u) => u.status === 'busy').length,
      away: users.filter((u) => u.status === 'away').length,
      offline: users.filter((u) => u.status === 'offline').length,
    }),
    [users]
  );

  const roleStats = useMemo(
    () => ({
      admin: users.filter((u) => u.role === 'admin').length,
      member: users.filter((u) => u.role === 'member').length,
      viewer: users.filter((u) => u.role === 'viewer').length,
    }),
    [users]
  );

  const inheritedCount = users.filter((u) => u.isInherited).length;
  const directCount = users.length - inheritedCount;

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!currentProject?.id) return;

    try {
      await updateRole.mutateAsync({
        entityType: 'project',
        entityId: currentProject.id,
        userId,
        data: { role: newRole },
      });
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentProject?.id) return;

    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMember.mutateAsync({
        entityType: 'project',
        entityId: currentProject.id,
        userId,
      });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading team members...</p>
        </div>
      </div>
    );
  }

  const activeFilterCount =
    (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <>
      <PageMeta title="Team | ORA SCRUM" description="Manage your team members" />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {users.length} total member{users.length !== 1 ? 's' : ''} ({directCount} direct,{' '}
              {inheritedCount} inherited)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              title="Export members"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setIsInviteMemberModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {/* Status Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-200 dark:ring-green-900" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusStats.online}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-900" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Away</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusStats.away}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200 dark:ring-red-900" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Busy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusStats.busy}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 ring-2 ring-gray-200 dark:ring-gray-700" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Offline</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statusStats.offline}
            </p>
          </div>

          {/* Role Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.admin}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <UsersIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Members</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.member}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Inherited
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{inheritedCount}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors relative ${
                activeFilterCount > 0
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setRoleFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  disabled={activeFilterCount === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {filteredMembers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No team members found
                </h3>
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Try adjusting your filters
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Get started by inviting your first team member
                    </p>
                    <button
                      onClick={() => setIsInviteMemberModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite First Member
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  tasksCount={getTasksForMember(member.userId)}
                  currentUserId={currentUser?.id}
                  onViewProfile={() => {
                    // TODO: Implement profile view
                    console.log('View profile:', member.userId);
                  }}
                  onUpdateRole={(newRole) => handleUpdateRole(member.userId, newRole)}
                  onRemove={() => handleRemoveMember(member.userId)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredMembers.map((member) => {
                      const isCurrentUserRow = member.userId === currentUser?.id;
                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {member.avatar ? (
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white dark:ring-gray-800">
                                    {member.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .toUpperCase()}
                                  </div>
                                )}
                                <span
                                  className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                                  style={{
                                    backgroundColor:
                                      member.status === 'online'
                                        ? '#10B981'
                                        : member.status === 'busy'
                                          ? '#F59E0B'
                                          : member.status === 'away'
                                            ? '#6B7280'
                                            : '#D1D5DB',
                                  }}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {member.name}
                                  </p>
                                  {isCurrentUserRow && (
                                    <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-medium rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    member.status === 'online'
                                      ? '#10B981'
                                      : member.status === 'busy'
                                        ? '#F59E0B'
                                        : member.status === 'away'
                                          ? '#6B7280'
                                          : '#9CA3AF',
                                }}
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {member.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {getTasksForMember(member.userId)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {member.isInherited ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                Inherited
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                Direct
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!member.isInherited && !isCurrentUserRow && (
                              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Team;
