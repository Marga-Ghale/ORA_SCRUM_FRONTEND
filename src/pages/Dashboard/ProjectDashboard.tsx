import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  LayoutGrid,
  ListTodo,
  Calendar,
  Settings,
  ArrowRight,
  Plus,
  Target,
  Zap,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { STATUS_COLUMNS } from '../../types/project';
import PageMeta from '../../components/common/PageMeta';
import TaskCard from '../../components/tasks/TaskCard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import { useAuth } from '../../components/UserProfile/AuthContext';
import { useProjectUsers } from '../../hooks/useUser';

const ProjectDashboard: React.FC = () => {
  const {
    tasks,
    currentProject,
    tasksLoading,
  } = useProject();

  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch real users from project
  const { data: projectUsers } = useProjectUsers(currentProject?.id || '');
  const users = projectUsers || [];

  // Get user's tasks (dynamic)
  const myTasks = tasks.filter(t => t.assignee?.id === user?.id);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Dynamic status counts
  const statusCounts = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status.id] = tasks.filter(t => t.status === status.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Progress calculation (dynamic)
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const progressPercentage = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  // Calculate trend (simplified)
  const lastWeekTasks = tasks.filter(t => {
    const taskDate = new Date(t.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return taskDate >= weekAgo;
  }).length;
  const trend = lastWeekTasks > 0 ? `+${lastWeekTasks} this week` : 'No change';

  // Dynamic project board link
  const boardLink = currentProject
    ? `/project/${currentProject.id}/board`
    : '/';

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-brand-500"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Dashboard - ${currentProject?.name || 'ORA SCRUM'}`}
        description="Project management dashboard"
      />

      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentProject
                ? `Here's what's happening in ${currentProject.name}`
                : "Here's an overview of your projects"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={boardLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              View Board
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              {lastWeekTasks > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{tasks.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              {inProgressTasks > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Active
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {statusCounts['in_progress'] || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              {progressPercentage > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                  {progressPercentage}%
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {statusCounts['done'] || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex -space-x-2">
                {users.slice(0, 3).map(member => (
                  member.avatar ? (
                    <img
                      key={member.id}
                      src={member.avatar}
                      alt={member.name}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900"
                    />
                  ) : (
                    <div
                      key={member.id}
                      className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-medium text-brand-600 dark:text-brand-400"
                    >
                      {member.name.charAt(0)}
                    </div>
                  )
                ))}
                {users.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300">
                    +{users.length - 3}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - My Tasks & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">My Tasks</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {myTasks.length} task{myTasks.length !== 1 ? 's' : ''} assigned to you
                    </p>
                  </div>
                </div>
                <Link
                  to="/my-tasks"
                  className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-4">
                {myTasks.length > 0 ? (
                  <div className="space-y-3">
                    {myTasks.slice(0, 4).map(task => (
                      <TaskCard key={task.id} task={task} compact />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">All caught up!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No tasks assigned to you</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create a task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentTasks.length > 0 ? (
                  recentTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {task.reporter?.avatar ? (
                          <img
                            src={task.reporter.avatar}
                            alt={task.reporter.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {task.reporter?.name?.split(' ').map(n => n[0]).join('') || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{task.reporter?.name || 'Unknown'}</span>
                          <span className="text-gray-500 dark:text-gray-400"> updated </span>
                          <span className="font-medium text-brand-600 dark:text-brand-400">{task.key}</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(task.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Clock className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Progress & Team */}
          <div className="space-y-6">
            {/* Project Progress */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Progress</h2>
              </div>

              {/* Progress Circle */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-100 dark:text-gray-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercentage * 3.52} 352`}
                    className="text-brand-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {progressPercentage}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Complete</span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-3">
                {STATUS_COLUMNS.filter(s => s.id !== 'cancelled').map(status => {
                  const count = statusCounts[status.id] || 0;
                  const percentage = tasks.length > 0
                    ? Math.round((count / tasks.length) * 100)
                    : 0;

                  return (
                    <div key={status.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {status.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: status.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Team</h2>
                </div>
                {currentProject && (
                  <Link
                    to={`/project/${currentProject.id}/team`}
                    className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                  >
                    View all
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {users.slice(0, 5).map(member => {
                  const memberTasks = tasks.filter(t => t.assignee?.id === member.id);
                  const completedCount = memberTasks.filter(t => t.status === 'done').length;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-9 h-9 rounded-full"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900"
                          style={{
                            backgroundColor:
                              member.status === 'online' ? '#10B981' :
                              member.status === 'busy' ? '#F59E0B' :
                              member.status === 'away' ? '#EAB308' : '#9CA3AF'
                          }}
                          title={member.status}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {member.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {memberTasks.length}
                        </p>
                        <p className="text-xs text-gray-400">
                          {completedCount} done
                        </p>
                      </div>
                    </div>
                  );
                })}
                {users.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No team members</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={boardLink}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
                >
                  <LayoutGrid className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Board
                  </span>
                </Link>

                <Link
                  to="/backlog"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
                >
                  <ListTodo className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Backlog
                  </span>
                </Link>

                <Link
                  to="/calendar"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
                >
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Calendar
                  </span>
                </Link>

                <Link
                  to="/settings"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
                >
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Settings
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskDetailModal />
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};

export default ProjectDashboard;
