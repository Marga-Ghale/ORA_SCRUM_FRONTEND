import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Mail,
  Users as UsersIcon,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { User } from '../../types/project';
import PageMeta from '../../components/common/PageMeta';
import { useProjectUsers } from '../../hooks/useUser';

interface TeamMemberCardProps {
  member: User;
  tasksCount: number;
  completedCount: number;
  onViewProfile: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, tasksCount, completedCount, onViewProfile }) => {
  const statusConfig = {
    online: { color: '#10B981', label: 'Online', bg: 'bg-green-50 dark:bg-green-500/10' },
    busy: { color: '#F59E0B', label: 'Busy', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    away: { color: '#6B7280', label: 'Away', bg: 'bg-gray-100 dark:bg-gray-700' },
    offline: { color: '#9CA3AF', label: 'Offline', bg: 'bg-gray-100 dark:bg-gray-700' },
  };

  const roleConfig = {
    admin: { bg: 'bg-brand-50 dark:bg-brand-500/10', text: 'text-brand-600 dark:text-brand-400' },
    member: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
    viewer: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400' },
  };

  const status = statusConfig[member.status] || statusConfig.offline;
  const role = roleConfig[member.role] || roleConfig.member;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-lg font-semibold text-white ring-2 ring-white dark:ring-gray-900">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-gray-900"
            style={{ backgroundColor: status.color }}
            title={status.label}
          />
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${role.bg} ${role.text}`}>
          {member.role}
        </span>
      </div>

      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
        {member.name}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
        {member.email}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{tasksCount}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{completedCount}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Done</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onViewProfile}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          View Profile
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Mail className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
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

  const filteredMembers = users.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getTasksForMember = (memberId: string) => {
    return tasks.filter(t => t.assignee?.id === memberId).length;
  };

  const getCompletedTasksForMember = (memberId: string) => {
    return tasks.filter(t => t.assignee?.id === memberId && t.status === 'done').length;
  };

  const statusStats = {
    online: users.filter(u => u.status === 'online').length,
    busy: users.filter(u => u.status === 'busy').length,
    away: users.filter(u => u.status === 'away').length,
    offline: users.filter(u => u.status === 'offline').length,
  };

  return (
    <>
      <PageMeta title="Team | ORA SCRUM" description="Manage your team members" />

      <div className="flex flex-col h-full pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Team</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {users.length} member{users.length !== 1 ? 's' : ''} in {currentWorkspace?.name || 'workspace'}
            </p>
          </div>
          <button
            onClick={() => setIsInviteMemberModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>

        {/* Status Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Online</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusStats.online}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Busy</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusStats.busy}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Away</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusStats.away}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Offline</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusStats.offline}</p>
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
                className="pl-9 pr-4 py-2.5 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map(member => (
              <TeamMemberCard
                key={member.id}
                member={member}
                tasksCount={getTasksForMember(member.id)}
                completedCount={getCompletedTasksForMember(member.id)}
                onViewProfile={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-sm font-medium text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900"
                            style={{
                              backgroundColor:
                                member.status === 'online' ? '#10B981' :
                                member.status === 'busy' ? '#F59E0B' :
                                member.status === 'away' ? '#6B7280' : '#9CA3AF'
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                        member.role === 'admin'
                          ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              member.status === 'online' ? '#10B981' :
                              member.status === 'busy' ? '#F59E0B' :
                              member.status === 'away' ? '#6B7280' : '#9CA3AF'
                          }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{member.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getTasksForMember(member.id)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({getCompletedTasksForMember(member.id)} done)
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">No team members found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Invite members to get started'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Team;
