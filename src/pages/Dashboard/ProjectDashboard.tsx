// src/pages/Dashboard/Dashboard.tsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Activity,
  TrendingUp,
  BarChart3,
  Calendar,
  Folder,
  Layers,
  Briefcase,
  ArrowRight,
  Target,
  Award,
} from 'lucide-react';
import { useMyMemberships, useEffectiveMembers } from '../../hooks/api/useMembers';
import { useWorkspaces } from '../../hooks/api/useWorkspaces';
import { useSpacesByWorkspace } from '../../hooks/api/useSpaces';
import { useProjectsBySpace } from '../../hooks/api/useProjects';

import PageMeta from '../../components/common/PageMeta';
import { useAutoStatus } from '../../hooks/api/useStatus';
import { useCurrentUser } from '../../hooks/useUser';
import { useMyFolders } from '../../hooks/api/useFolder';

// Status Badge Component
const StatusBadge: React.FC<{ status?: string }> = ({ status = 'offline' }) => {
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online', ring: 'ring-green-200 dark:ring-green-900' },
    away: { color: 'bg-yellow-500', label: 'Away', ring: 'ring-yellow-200 dark:ring-yellow-900' },
    busy: { color: 'bg-red-500', label: 'Busy', ring: 'ring-red-200 dark:ring-red-900' },
    offline: { color: 'bg-gray-400', label: 'Offline', ring: 'ring-gray-200 dark:ring-gray-700' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className={`w-2.5 h-2.5 rounded-full ${config.color} ring-2 ${config.ring}`} />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700 transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {trendUp && <TrendingUp className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

// Team Member Card Component
interface TeamMemberCardProps {
  member: {
    userId: string;
    user?: {
      name: string;
      email: string;
      avatar?: string;
      status?: string;
    };
    role: string;
    isInherited: boolean;
  };
  onViewProfile?: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, onViewProfile }) => {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400',
  };

  const status = (member.user?.status || 'offline') as keyof typeof statusColors;

  return (
    <div
      onClick={onViewProfile}
      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {member.user?.avatar ? (
            <img
              src={member.user.avatar}
              alt={member.user.name}
              className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-gray-800"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white dark:ring-gray-800">
              {member.user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || '?'}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${statusColors[status]}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {member.user?.name || 'Unknown User'}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
            {member.isInherited && (
              <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                Inherited
              </span>
            )}
          </div>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// Workspace Card Component
interface WorkspaceCardProps {
  workspace: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
  };
  spacesCount: number;
  projectsCount: number;
  onClick?: () => void;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  spacesCount,
  projectsCount,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
          {workspace.icon ? (
            <span className="text-2xl">{workspace.icon}</span>
          ) : (
            <Briefcase className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {workspace.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {workspace.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Layers className="w-3.5 h-3.5" />
              <span className="font-medium">{spacesCount}</span>
              <span>space{spacesCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <FolderKanban className="w-3.5 h-3.5" />
              <span className="font-medium">{projectsCount}</span>
              <span>project{projectsCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    key: string;
    description?: string;
  };
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-xs font-bold text-white">{project.key}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {project.name}
          </h4>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
        {project.description || 'No description'}
      </p>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Auto-manage user status
  useAutoStatus();

  // Fetch current user
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // Fetch user memberships
  const { data: memberships, isLoading: membershipsLoading } = useMyMemberships();

  // Fetch workspaces
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();

  // Fetch spaces for the first workspace
  const firstWorkspaceId = workspaces?.[0]?.id;
  const { data: spaces } = useSpacesByWorkspace(firstWorkspaceId || '', {
    enabled: !!firstWorkspaceId,
  });

  // Fetch folders
  const { data: folders } = useMyFolders();

  // Fetch projects for the first space
  const firstSpaceId = spaces?.[0]?.id;
  const { data: projects, isLoading: projectsLoading } = useProjectsBySpace(firstSpaceId || '', {
    enabled: !!firstSpaceId,
  });

  // Fetch team members for first project
  const firstProjectId = projects?.[0]?.id;
  const { data: projectMembers, isLoading: membersLoading } = useEffectiveMembers(
    'project',
    firstProjectId || '',
    { enabled: !!firstProjectId }
  );

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const totalSpaces = spaces?.length || 0;
    const totalProjects = projects?.length || 0;
    const onlineMembers = projectMembers?.filter((m) => m.user?.status === 'online').length || 0;
    const totalMembers = projectMembers?.length || 0;

    return {
      workspaces: workspaces?.length || 0,
      spaces: totalSpaces,
      folders: folders?.length || 0,
      projects: totalProjects,
      memberships: memberships?.length || 0,
      onlineMembers,
      totalMembers,
    };
  }, [workspaces, spaces, folders, projects, memberships, projectMembers]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    if (!projectMembers) return { online: 0, away: 0, busy: 0, offline: 0 };

    return projectMembers.reduce(
      (acc, member) => {
        const status = member.user?.status || 'offline';
        acc[status as keyof typeof acc] = (acc[status as keyof typeof acc] || 0) + 1;
        return acc;
      },
      { online: 0, away: 0, busy: 0, offline: 0 }
    );
  }, [projectMembers]);

  const isLoading = userLoading || workspacesLoading || membershipsLoading;

  return (
    <>
      <PageMeta title="Dashboard | ORA SCRUM" description="Your project management dashboard" />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {currentUser?.name || 'User'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's an overview of your projects and team activity
            </p>
          </div>
          <StatusBadge status={currentUser?.status} />
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Workspaces"
              value={stats.workspaces}
              icon={Briefcase}
              trend="Your workspaces"
              onClick={() => navigate('/workspaces')}
            />
            <StatsCard
              title="Active Projects"
              value={stats.projects}
              icon={FolderKanban}
              trend="In progress"
              trendUp={stats.projects > 0}
              onClick={() => navigate('/projects')}
            />
            <StatsCard
              title="Team Members"
              value={stats.totalMembers}
              icon={Users}
              trend={`${stats.onlineMembers} online now`}
              trendUp={stats.onlineMembers > 0}
              onClick={() => navigate('/team')}
            />
            <StatsCard
              title="Your Memberships"
              value={stats.memberships}
              icon={Award}
              trend="Across all entities"
            />
          </div>
        )}

        {/* Team Status Overview */}
        {stats.totalMembers > 0 && (
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Team Status</h3>
              </div>
              <button
                onClick={() => navigate('/team')}
                className="text-sm font-medium text-white/90 hover:text-white flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-white/80">Online</span>
                </div>
                <p className="text-2xl font-bold">{statusDistribution.online}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-sm text-white/80">Away</span>
                </div>
                <p className="text-2xl font-bold">{statusDistribution.away}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm text-white/80">Busy</span>
                </div>
                <p className="text-2xl font-bold">{statusDistribution.busy}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm text-white/80">Offline</span>
                </div>
                <p className="text-2xl font-bold">{statusDistribution.offline}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workspaces & Projects - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workspaces */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Workspaces
                  </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.workspaces} total
                </span>
              </div>

              {workspacesLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : workspaces && workspaces.length > 0 ? (
                <div className="space-y-3">
                  {workspaces.slice(0, 3).map((workspace) => (
                    <WorkspaceCard
                      key={workspace.id}
                      workspace={workspace}
                      spacesCount={workspace.id === firstWorkspaceId ? spaces?.length || 0 : 0}
                      projectsCount={workspace.id === firstWorkspaceId ? projects?.length || 0 : 0}
                      onClick={() => navigate(`/workspace/${workspace.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No workspaces yet</p>
                  <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    Create Workspace
                  </button>
                </div>
              )}
            </div>

            {/* Recent Projects */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Active Projects
                  </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.projects} total
                </span>
              </div>

              {projectsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.slice(0, 6).map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => navigate(`/project/${project.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team</h2>
                </div>
                <button
                  onClick={() => navigate('/team')}
                  className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {membersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-14 bg-gray-50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : !firstProjectId ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create a project to see team members
                  </p>
                </div>
              ) : !projectMembers || projectMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {projectMembers.slice(0, 8).map((member) => (
                    <TeamMemberCard
                      key={member.userId}
                      member={member}
                      onViewProfile={() => navigate('/team')}
                    />
                  ))}
                  {projectMembers.length > 8 && (
                    <button
                      onClick={() => navigate('/team')}
                      className="w-full py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                    >
                      View {projectMembers.length - 8} more members
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Folders</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">
                    {stats.folders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Spaces</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">
                    {stats.spaces}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Memberships</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">
                    {stats.memberships}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {membershipsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : memberships && memberships.length > 0 ? (
              memberships.slice(0, 6).map((membership, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Joined as{' '}
                      <span className="font-medium capitalize text-brand-600 dark:text-brand-400">
                        {membership.role}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                      {membership.entityType} · Entity ID: {membership.entityId.substring(0, 8)}...
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">Recent</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
