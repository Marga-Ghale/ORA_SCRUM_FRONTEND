import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  MessageCircle,
  Users as UsersIcon,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { User } from '../../types/project';
import PageMeta from '../../components/common/PageMeta';
import { useProjectUsers } from '../../hooks/useUser';

interface TeamMemberCardProps {
  member: User;
  tasksCount: number;
  onViewProfile: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, tasksCount, onViewProfile }) => {
  const statusColors = {
    online: '#10B981',
    busy: '#F59E0B',
    away: '#6B7280',
    offline: '#D1D5DB',
  };

  const roleColors = {
    admin: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
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
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleColors[member.role]}`}
        >
          {member.role}
        </span>
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
  const { tasks, currentWorkspace, currentProject, setIsInviteMemberModalOpen } = useProject();

  // Fetch real users from project API
  const { data: projectUsers } = useProjectUsers(currentProject?.id || '');
  const users = projectUsers || [];

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredMembers = users.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getTasksForMember = (memberId: string) => {
    return tasks.filter((t) => t.assignee?.id === memberId).length;
  };

  const statusStats = {
    online: users.filter((u) => u.status === 'online').length,
    busy: users.filter((u) => u.status === 'busy').length,
    away: users.filter((u) => u.status === 'away').length,
    offline: users.filter((u) => u.status === 'offline').length,
  };

  return (
    <>
      <PageMeta title="Team | ORA SCRUM" description="Manage your team members" />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {users.length} members in {currentWorkspace?.name || 'workspace'}
            </p>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
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
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                tasksCount={getTasksForMember(member.id)}
                onViewProfile={() => {}}
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

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No team members found</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Team;
