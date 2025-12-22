// ✅ COMPLETE REPLACEMENT: src/pages/Team/Team.tsx

import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  MessageCircle,
  Users as UsersIcon,
  Building2,
  FolderOpen,
  Folder,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import PageMeta from '../../components/common/PageMeta';
import { useEffectiveMembers, EntityType } from '../../hooks/api/useMembers';
import { useAllAccessibleEntities } from '../../hooks/api/useAccessibleEntities';
import InviteMemberModal from '../../components/members/Invitemembermodal';

interface TeamMember {
  id: string;
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
  onViewProfile: () => void;
}

const ENTITY_ICONS = {
  workspace: Building2,
  space: FolderOpen,
  folder: Folder,
  project: FileText,
};

const ENTITY_COLORS = {
  workspace: '#7c3aed',
  space: '#60a5fa',
  folder: '#fbbf24',
  project: '#ec4899',
};

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, tasksCount, onViewProfile }) => {
  const statusColors = {
    online: '#10B981',
    busy: '#F59E0B',
    away: '#6B7280',
    offline: '#D1D5DB',
  };

  const roleColors = {
    owner: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    admin: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
    lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    member: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    viewer: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xl font-semibold text-brand-600 dark:text-brand-400">
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
          )}
          <span
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
            style={{ backgroundColor: statusColors[member.status] }}
            title={member.status}
          />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
              roleColors[member.role as keyof typeof roleColors] || roleColors.member
            }`}
          >
            {member.role}
          </span>
          {member.isInherited && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              From {member.inheritedFrom}
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{member.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{member.email}</p>

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
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Team: React.FC = () => {
  const { tasks, currentWorkspace, currentProject, currentSpace } = useProject();

  // ✅ Fetch all accessible entities
  const {
    workspaces,
    spaces,
    folders,
    projects,
    isLoading: entitiesLoading,
  } = useAllAccessibleEntities();

  // ✅ Entity selection state
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('workspace');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);

  // ✅ Set default entity from context
  React.useEffect(() => {
    if (currentProject?.id && selectedEntityId === '') {
      setSelectedEntityType('project');
      setSelectedEntityId(currentProject.id);
      setSelectedEntityName(currentProject.name);
    } else if (currentSpace?.id && selectedEntityId === '') {
      setSelectedEntityType('space');
      setSelectedEntityId(currentSpace.id);
      setSelectedEntityName(currentSpace.name);
    } else if (currentWorkspace?.id && selectedEntityId === '') {
      setSelectedEntityType('workspace');
      setSelectedEntityId(currentWorkspace.id);
      setSelectedEntityName(currentWorkspace.name);
    }
  }, [currentProject, currentSpace, currentWorkspace, selectedEntityId]);

  // Fetch members for selected entity
  const { data: members, isLoading: membersLoading } = useEffectiveMembers(
    selectedEntityType,
    selectedEntityId,
    { enabled: !!selectedEntityId }
  );

  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);

  const users = useMemo<TeamMember[]>(() => {
    if (!members) return [];

    return members.map((member) => ({
      id: member.userId,
      name: member.user?.name || 'Unknown',
      email: member.user?.email || '',
      avatar: member.user?.avatar,
      role: member.role,
      status: (member.user?.status as 'online' | 'offline' | 'away' | 'busy') || 'offline',
      isInherited: member.isInherited,
      inheritedFrom: member.inheritedFrom,
    }));
  }, [members]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'direct' | 'inherited'>('all');

  const filteredMembers = useMemo(() => {
    return users.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'direct' && !member.isInherited) ||
        (accessFilter === 'inherited' && member.isInherited);
      return matchesSearch && matchesRole && matchesAccess;
    });
  }, [users, searchQuery, roleFilter, accessFilter]);

  const getTasksForMember = (memberId: string) => {
    return tasks.filter((t) => t.assigneeIds?.includes(memberId as any)).length;
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

  const directMembersCount = users.filter((u) => !u.isInherited).length;
  const inheritedMembersCount = users.filter((u) => u.isInherited).length;

  const EntityIcon = ENTITY_ICONS[selectedEntityType];

  // ✅ Build entity options for dropdown
  const entityOptions = useMemo(() => {
    const options: Array<{ type: EntityType; id: string; name: string; parentName?: string }> = [];

    workspaces.forEach((w) => {
      options.push({ type: 'workspace', id: w.id, name: w.name });
    });

    spaces.forEach((s) => {
      const workspace = workspaces.find((w) => w.id === s.workspaceId);
      options.push({
        type: 'space',
        id: s.id,
        name: s.name,
        parentName: workspace?.name,
      });
    });

    folders.forEach((f) => {
      const space = spaces.find((s) => s.id === f.spaceId);
      options.push({
        type: 'folder',
        id: f.id,
        name: f.name,
        parentName: space?.name,
      });
    });

    projects.forEach((p) => {
      const space = spaces.find((s) => s.id === p.spaceId);
      const folder = p.folderId ? folders.find((f) => f.id === p.folderId) : null;
      options.push({
        type: 'project',
        id: p.id,
        name: p.name,
        parentName: folder ? folder.name : space?.name,
      });
    });

    return options;
  }, [workspaces, spaces, folders, projects]);

  const handleSelectEntity = (option: (typeof entityOptions)[0]) => {
    setSelectedEntityType(option.type);
    setSelectedEntityId(option.id);
    setSelectedEntityName(option.name);
    setShowEntityDropdown(false);
  };

  if (entitiesLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Team | ORA SCRUM" description="Manage your team members" />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${ENTITY_COLORS[selectedEntityType]}20` }}
            >
              <EntityIcon
                className="w-6 h-6"
                style={{ color: ENTITY_COLORS[selectedEntityType] }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {users.length} member{users.length !== 1 ? 's' : ''} in
                </span>
                {/* Entity Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowEntityDropdown(!showEntityDropdown)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {selectedEntityType}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEntityName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showEntityDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowEntityDropdown(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                        {entityOptions.map((option) => {
                          const Icon = ENTITY_ICONS[option.type];
                          const isSelected =
                            option.type === selectedEntityType && option.id === selectedEntityId;

                          return (
                            <button
                              key={`${option.type}-${option.id}`}
                              onClick={() => handleSelectEntity(option)}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                isSelected ? 'bg-brand-50 dark:bg-brand-900/30' : ''
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${ENTITY_COLORS[option.type]}20` }}
                              >
                                <Icon
                                  className="w-4 h-4"
                                  style={{ color: ENTITY_COLORS[option.type] }}
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {option.name}
                                </p>
                                {option.parentName && (
                                  <p className="text-xs text-gray-500 truncate">
                                    in {option.parentName}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize">
                                {option.type}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsInviteMemberModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Online</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusStats.online}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-warning-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Busy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusStats.busy}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Away</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusStats.away}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Offline</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statusStats.offline}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Direct</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{directMembersCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Inherited</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {inheritedMembersCount}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="lead">Lead</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Access</option>
              <option value="direct">Direct Only</option>
              <option value="inherited">Inherited Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
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
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No team members found</p>
            {searchQuery || roleFilter !== 'all' || accessFilter !== 'all' ? (
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            ) : (
              <button
                onClick={() => setIsInviteMemberModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite First Member
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                tasksCount={getTasksForMember(member.id)}
                onViewProfile={() => {
                  console.log('View profile:', member.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredMembers.map((member) => (
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
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-medium text-brand-600 dark:text-brand-400">
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
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
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.isInherited ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                          From {member.inheritedFrom}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                          Direct
                        </span>
                      )}
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
                        {getTasksForMember(member.id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <InviteMemberModal
          isOpen={isInviteMemberModalOpen}
          onClose={() => setIsInviteMemberModalOpen(false)}
          defaultEntity={
            selectedEntityId
              ? {
                  type: selectedEntityType,
                  id: selectedEntityId,
                  name: selectedEntityName,
                }
              : undefined
          }
        />
      </div>
    </>
  );
};

export default Team;
