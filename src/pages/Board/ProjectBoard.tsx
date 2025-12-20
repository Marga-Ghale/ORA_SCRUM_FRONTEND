// src/pages/Dashboard/Dashboard.tsx
import React, { useMemo } from 'react';
import {
  Users,
  FolderKanban,
  Activity,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Briefcase,
} from 'lucide-react';
import { useMyMemberships, useEffectiveMembers } from '../../hooks/api/useMembers';
import { useWorkspaces } from '../../hooks/api/useWorkspaces';
import { useSpacesByWorkspace } from '../../hooks/api/useSpaces';
import { useProjectsBySpace } from '../../hooks/api/useProjects';
import PageMeta from '../../components/common/PageMeta';
import { useCurrentUser } from '../../hooks/api/useAuth';
import { useMyFolders } from '../../hooks/api/useFolder';
import { useAutoStatus } from '../../hooks/api/useStatus';

// Status Badge Component
const StatusBadge: React.FC<{ status?: string }> = ({ status = 'offline' }) => {
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online', ring: 'ring-green-200' },
    away: { color: 'bg-yellow-500', label: 'Away', ring: 'ring-yellow-200' },
    busy: { color: 'bg-red-500', label: 'Busy', ring: 'ring-red-200' },
    offline: { color: 'bg-gray-400', label: 'Offline', ring: 'ring-gray-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${config.color} ring-2 ${config.ring} animate-pulse`} />
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{config.label}</span>
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
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'brand',
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-gray-500'}`}
            >
              {trendUp && <TrendingUp className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`w-14 h-14 bg-${color}-100 dark:bg-${color}-900 rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-7 h-7 text-${color}-600 dark:text-${color}-400`} />
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
  };
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center gap-3">
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
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {member.user?.name || 'Unknown User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
        </div>
      </div>
      <StatusBadge status={member.user?.status} />
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
    color?: string;
  };
  spacesCount: number;
  projectsCount: number;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, spacesCount, projectsCount }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group">
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            workspace.color
              ? `bg-${workspace.color}-100 dark:bg-${workspace.color}-900`
              : 'bg-brand-100 dark:bg-brand-900'
          }`}
        >
          {workspace.icon ? (
            <span className="text-2xl">{workspace.icon}</span>
          ) : (
            <Briefcase className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {workspace.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {workspace.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>
                {spacesCount} space{spacesCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>
                {projectsCount} project{projectsCount !== 1 ? 's' : ''}
              </span>
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
    icon?: string;
    color?: string;
  };
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            project.color
              ? `bg-${project.color}-100 dark:bg-${project.color}-900`
              : 'bg-brand-100 dark:bg-brand-900'
          }`}
        >
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
            {project.key}
          </span>
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
  const { data: spaces, isLoading: spacesLoading } = useSpacesByWorkspace(firstWorkspaceId || '', {
    enabled: !!firstWorkspaceId,
  });

  // Fetch folders
  const { data: folders, isLoading: foldersLoading } = useMyFolders();

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
    const totalSpaces =
      workspaces?.reduce((acc, workspace) => {
        // Count spaces for each workspace (would need to fetch individually)
        return acc + (workspace.id === firstWorkspaceId ? spaces?.length || 0 : 0);
      }, 0) ||
      spaces?.length ||
      0;

    const totalProjects =
      spaces?.reduce((acc, space) => {
        // Count projects for each space (would need to fetch individually)
        return acc + (space.id === firstSpaceId ? projects?.length || 0 : 0);
      }, 0) ||
      projects?.length ||
      0;

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
  }, [
    workspaces,
    spaces,
    folders,
    projects,
    memberships,
    projectMembers,
    firstWorkspaceId,
    firstSpaceId,
  ]);

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
              Here's what's happening with your projects today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentUser?.status} />
          </div>
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
            />
            <StatsCard
              title="Spaces"
              value={stats.spaces}
              icon={Layers}
              trend="Across workspaces"
            />
            <StatsCard
              title="Projects"
              value={stats.projects}
              icon={FolderKanban}
              trend="Active projects"
              trendUp={stats.projects > 0}
            />
            <StatsCard
              title="Team Online"
              value={`${stats.onlineMembers}/${stats.totalMembers}`}
              icon={Activity}
              trend="Active now"
              trendUp={stats.onlineMembers > 0}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workspaces Overview - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workspaces */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
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
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No workspaces yet</p>
                  <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Create Workspace
                  </button>
                </div>
              )}
            </div>

            {/* Recent Projects */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Projects
                  </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.projects} total
                </span>
              </div>

              {projectsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.slice(0, 6).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team</h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.onlineMembers} online
                </span>
              </div>

              {membersLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-14 bg-gray-50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : !firstProjectId ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create a project to see team members
                  </p>
                </div>
              ) : !projectMembers || projectMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {projectMembers.map((member) => (
                    <TeamMemberCard key={member.userId} member={member} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5" />
                <h3 className="font-semibold">Quick Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-brand-100">Folders</span>
                  <span className="font-bold text-xl">{stats.folders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-100">Memberships</span>
                  <span className="font-bold text-xl">{stats.memberships}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-100">Spaces</span>
                  <span className="font-bold text-xl">{stats.spaces}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
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
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : memberships && memberships.length > 0 ? (
              memberships.slice(0, 5).map((membership, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      You joined as{' '}
                      <span className="font-medium capitalize">{membership.role}</span> in{' '}
                      <span className="font-medium capitalize">{membership.entityType}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Entity ID: {membership.entityId}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">Recent</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
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
