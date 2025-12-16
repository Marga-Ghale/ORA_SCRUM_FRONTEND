import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import PageMeta from '../../components/common/PageMeta';

type SettingsTab = 'general' | 'members' | 'notifications' | 'integrations' | 'danger';

const Settings: React.FC = () => {
  const { currentProject, users, setIsInviteMemberModalOpen } = useProject();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [projectName, setProjectName] = useState(currentProject?.name || '');
  const [projectKey, setProjectKey] = useState(currentProject?.key || '');
  const [projectDescription, setProjectDescription] = useState(currentProject?.description || '');

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'integrations', label: 'Integrations', icon: '🔌' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
  ];

  return (
    <>
      <PageMeta title="Settings | ORA SCRUM" description="Project settings" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your project configuration and team settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      activeTab === tab.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                    ${tab.id === 'danger' ? 'text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20' : ''}
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  General Settings
                </h2>

                <div className="space-y-6">
                  {/* Project Icon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Icon
                    </label>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl text-white font-bold"
                        style={{ backgroundColor: currentProject?.color || '#465FFF' }}
                      >
                        {currentProject?.key?.slice(0, 2) || 'PR'}
                      </div>
                      <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Change Icon
                      </button>
                    </div>
                  </div>

                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Project Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Key
                    </label>
                    <input
                      type="text"
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used as prefix for task keys (e.g., ORA-123)
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      placeholder="Describe your project..."
                    />
                  </div>

                  {/* Project Lead */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Lead
                    </label>
                    <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Members Settings */}
            {activeTab === 'members' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Members
                  </h2>
                  <button
                    onClick={() => setIsInviteMemberModalOpen(true)}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Member
                  </button>
                </div>

                <div className="space-y-3">
                  {users.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full"
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
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          defaultValue={member.role}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button className="p-2 text-gray-400 hover:text-error-500 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Notification Preferences
                </h2>

                <div className="space-y-6">
                  {[
                    {
                      id: 'task_assigned',
                      label: 'Task assigned to me',
                      desc: 'Get notified when a task is assigned to you',
                    },
                    {
                      id: 'task_updated',
                      label: 'Task updates',
                      desc: 'Get notified when tasks you follow are updated',
                    },
                    {
                      id: 'comments',
                      label: 'New comments',
                      desc: 'Get notified when someone comments on your tasks',
                    },
                    {
                      id: 'mentions',
                      label: 'Mentions',
                      desc: 'Get notified when you are mentioned',
                    },
                    {
                      id: 'sprint',
                      label: 'Sprint updates',
                      desc: 'Get notified about sprint starts and completions',
                    },
                    {
                      id: 'daily_digest',
                      label: 'Daily digest',
                      desc: 'Receive a daily summary of project activity',
                    },
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {notification.label}
                        </p>
                        <p className="text-sm text-gray-500">{notification.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <button className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Integrations
                </h2>

                <div className="space-y-4">
                  {[
                    {
                      name: 'GitHub',
                      icon: '🐙',
                      desc: 'Connect with GitHub for code integration',
                      connected: true,
                    },
                    {
                      name: 'Slack',
                      icon: '💬',
                      desc: 'Send notifications to Slack channels',
                      connected: false,
                    },
                    {
                      name: 'Google Calendar',
                      icon: '📅',
                      desc: 'Sync due dates with your calendar',
                      connected: true,
                    },
                    {
                      name: 'Figma',
                      icon: '🎨',
                      desc: 'Embed Figma designs in tasks',
                      connected: false,
                    },
                    {
                      name: 'GitLab',
                      icon: '🦊',
                      desc: 'Connect with GitLab for code integration',
                      connected: false,
                    },
                  ].map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                          {integration.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {integration.name}
                          </p>
                          <p className="text-sm text-gray-500">{integration.desc}</p>
                        </div>
                      </div>
                      {integration.connected ? (
                        <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Configure
                        </button>
                      ) : (
                        <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-error-200 dark:border-error-900 p-6">
                <h2 className="text-lg font-semibold text-error-600 dark:text-error-400 mb-6">
                  Danger Zone
                </h2>

                <div className="space-y-6">
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Archive Project</p>
                        <p className="text-sm text-gray-500">
                          Archive this project and hide it from the workspace
                        </p>
                      </div>
                      <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Archive
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-error-200 dark:border-error-900 bg-error-50 dark:bg-error-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-error-600 dark:text-error-400">
                          Delete Project
                        </p>
                        <p className="text-sm text-error-500 dark:text-error-400/80">
                          Permanently delete this project and all of its data
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg text-sm font-medium transition-colors">
                        Delete Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
