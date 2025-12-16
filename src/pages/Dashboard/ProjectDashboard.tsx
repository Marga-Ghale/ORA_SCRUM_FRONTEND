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
  const { tasks, currentProject, tasksLoading } = useProject();

  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch real users from project
  const { data: projectUsers } = useProjectUsers(currentProject?.id || '');
  const users = projectUsers || [];

  // Get user's tasks (dynamic)
  const myTasks = tasks.filter((t) => t.assignee?.id === user?.id);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Dynamic status counts
  const statusCounts = STATUS_COLUMNS.reduce(
    (acc, status) => {
      acc[status.id] = tasks.filter((t) => t.status === status.id).length;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Progress calculation (dynamic)
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const progressPercentage =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Calculate trend (simplified - you could track this over time)
  const lastWeekTasks = tasks.filter((t) => {
    const taskDate = new Date(t.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return taskDate >= weekAgo;
  }).length;
  const trend = lastWeekTasks > 0 ? `+${lastWeekTasks} this week` : 'No change';

  // Dynamic project board link
  const boardLink = currentProject ? `/project/${currentProject.id}/board` : '/';

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Dashboard - ${currentProject?.name || 'ORA SCRUM'}`}
        description="Project management dashboard"
      />

      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-brand-100">
                {currentProject
                  ? `Working on ${currentProject.name}`
                  : "Here's what's happening with your projects today"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={boardLink}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                View Board
              </Link>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-white text-brand-600 hover:bg-brand-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-gray-500 font-medium">{trend}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          </div>

          {/* In Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statusCounts['in_progress'] || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          </div>

          {/* Completed */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              {progressPercentage > 0 && (
                <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {progressPercentage}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statusCounts['done'] || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>

          {/* Team Members */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - My Tasks & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-brand-500" />
                  My Tasks
                  {myTasks.length > 0 && (
                    <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-medium rounded-full">
                      {myTasks.length}
                    </span>
                  )}
                </h2>
                <Link
                  to="/my-tasks"
                  className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-5 space-y-3">
                {myTasks.slice(0, 4).map((task) => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
                {myTasks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No tasks assigned to you
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                    >
                      Create your first task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-500" />
                  Recent Activity
                </h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {task.reporter?.avatar ? (
                          <img
                            src={task.reporter.avatar}
                            alt={task.reporter.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {task.reporter?.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('') || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{task.reporter?.name || 'Unknown'}</span>
                          {' updated '}
                          <span className="font-medium text-brand-500">{task.key}</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentTasks.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Progress & Team */}
          <div className="space-y-6">
            {/* Project Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                Project Progress
              </h2>

              {/* Progress Circle */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercentage * 3.52} 352`}
                    className="text-brand-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {progressPercentage}%
                  </span>
                  <span className="text-xs text-gray-500">Complete</span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-2">
                {STATUS_COLUMNS.filter((s) => s.id !== 'cancelled').map((status) => {
                  const count = statusCounts[status.id] || 0;
                  const percentage =
                    tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;

                  return (
                    <div key={status.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {status.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{percentage}%</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[2ch] text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-500" />
                  Team
                </h2>
                {currentProject && (
                  <Link
                    to={`/project/${currentProject.id}/team`}
                    className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {users.slice(0, 5).map((member) => {
                  const memberTasks = tasks.filter((t) => t.assignee?.id === member.id);
                  const completedCount = memberTasks.filter((t) => t.status === 'done').length;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="relative">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-9 h-9 rounded-full"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                        )}
                        <span
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800"
                          style={{
                            backgroundColor:
                              member.status === 'online'
                                ? '#10B981'
                                : member.status === 'busy'
                                  ? '#F59E0B'
                                  : member.status === 'away'
                                    ? '#EAB308'
                                    : '#9CA3AF',
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
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {memberTasks.length}
                        </p>
                        <p className="text-xs text-gray-400">{completedCount} done</p>
                      </div>
                    </div>
                  );
                })}
                {users.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No team members</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={boardLink}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-200 dark:hover:border-brand-800 border border-transparent transition-all group"
                >
                  <LayoutGrid className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-brand-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    Board
                  </span>
                </Link>

                <Link
                  to="/backlog"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-200 dark:hover:border-brand-800 border border-transparent transition-all group"
                >
                  <ListTodo className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-brand-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    Backlog
                  </span>
                </Link>

                <Link
                  to="/calendar"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-200 dark:hover:border-brand-800 border border-transparent transition-all group"
                >
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-brand-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    Calendar
                  </span>
                </Link>

                <Link
                  to="/settings"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-200 dark:hover:border-brand-800 border border-transparent transition-all group"
                >
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-brand-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
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
      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

export default ProjectDashboard;
