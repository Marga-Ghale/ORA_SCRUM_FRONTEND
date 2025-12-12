import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { STATUS_COLUMNS } from '../../types/project';
import PageMeta from '../../components/common/PageMeta';
import TaskCard from '../../components/tasks/TaskCard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import { useAuth } from '../../components/UserProfile/AuthContext';

const ProjectDashboard: React.FC = () => {
  const { tasks, users } = useProject();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get user's tasks
  const myTasks = tasks.filter(t => t.assignee?.id === user?.id);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

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

  // Progress calculation
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <>
      <PageMeta title="Dashboard | ORA SCRUM" description="Project management dashboard" />

      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-brand-100">
                Here's what's happening with your projects today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/project/project-1/board"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                View Board
              </Link>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-white text-brand-600 hover:bg-brand-50 rounded-lg text-sm font-medium transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs text-green-500 font-medium">+12%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts['in_progress'] || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts['done'] || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
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
                <h2 className="font-semibold text-gray-900 dark:text-white">My Tasks</h2>
                <Link to="/my-tasks" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                  View all
                </Link>
              </div>
              <div className="p-5 space-y-3">
                {myTasks.slice(0, 4).map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
                {myTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>No tasks assigned to you</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {recentTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {task.reporter?.avatar ? (
                          <img src={task.reporter.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {task.reporter?.name?.split(' ').map(n => n[0]).join('') || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{task.reporter?.name || 'Unknown'}</span>
                          {' updated '}
                          <span className="font-medium text-brand-500">{task.key}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
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
                  ))}
                  {recentTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p>No recent activity</p>
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
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Project Progress</h2>
              <div className="relative w-32 h-32 mx-auto mb-4">
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
                    className="text-brand-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{progressPercentage}%</span>
                </div>
              </div>
              <div className="space-y-2">
                {STATUS_COLUMNS.slice(0, 4).map(status => (
                  <div key={status.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{status.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {statusCounts[status.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Team</h2>
                <Link to="/team" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {users.slice(0, 5).map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <span
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800"
                        style={{
                          backgroundColor: member.status === 'online' ? '#10B981' :
                            member.status === 'busy' ? '#F59E0B' : '#9CA3AF'
                        }}
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
                    <span className="text-xs text-gray-400">
                      {tasks.filter(t => t.assignee?.id === member.id).length} tasks
                    </span>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    <p>No team members</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/project/project-1/board"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-xl">⊞</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Board</span>
                </Link>
                <Link
                  to="/backlog"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-xl">📋</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Backlog</span>
                </Link>
                <Link
                  to="/calendar"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-xl">📅</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Calendar</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-xl">⚙️</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Settings</span>
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