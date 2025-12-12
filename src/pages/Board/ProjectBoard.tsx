import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import TaskListView from '../../components/tasks/TaskListView';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import PageMeta from '../../components/common/PageMeta';

const ProjectBoard: React.FC = () => {
  const {
    tasks,
    currentProject,
    currentSprint,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    users,
  } = useProject();

  const [showFilters, setShowFilters] = useState(false);

  // Get tasks for current sprint or all tasks
  const displayTasks = currentSprint
    ? tasks.filter(t => currentSprint.tasks.some(st => st.id === t.id) || ['todo', 'in_progress', 'in_review', 'done'].includes(t.status))
    : tasks;

  const viewOptions = [
    { id: 'board', label: 'Board', icon: '⊞' },
    { id: 'list', label: 'List', icon: '☰' },
    { id: 'table', label: 'Table', icon: '▤' },
  ] as const;

  return (
    <>
      <PageMeta title={`${currentProject?.name || 'Project'} Board | ORA SCRUM`} description="Project management board" />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <span>{currentProject?.key}</span>
              <span>/</span>
              <span>{currentSprint?.name || 'All Tasks'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentProject?.name || 'Project Board'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Task Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          {/* Left side - Search and Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
                ${showFilters || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f)
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
            </button>

            {/* Quick Assignee Filter */}
            <div className="flex -space-x-2">
              {users.slice(0, 4).map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      assignees: prev.assignees.includes(user.id)
                        ? prev.assignees.filter(id => id !== user.id)
                        : [...prev.assignees, user.id]
                    }));
                  }}
                  className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-all
                    ${filters.assignees.includes(user.id)
                      ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800'
                      : 'border-white dark:border-gray-800 hover:border-gray-300'
                    }
                  `}
                  title={user.name}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </button>
              ))}
              <button className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                +{users.length - 4}
              </button>
            </div>
          </div>

          {/* Right side - View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {viewOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${viewMode === option.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <span>{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {['urgent', 'high', 'medium', 'low'].map(priority => (
                    <button
                      key={priority}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          priorities: prev.priorities.includes(priority)
                            ? prev.priorities.filter(p => p !== priority)
                            : [...prev.priorities, priority]
                        }));
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors
                        ${filters.priorities.includes(priority)
                          ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {['task', 'bug', 'story', 'epic'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          types: prev.types.includes(type)
                            ? prev.types.filter(t => t !== type)
                            : [...prev.types, type]
                        }));
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors
                        ${filters.types.includes(type)
                          ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                <button
                  onClick={() => setFilters({ search: '', assignees: [], priorities: [], labels: [], types: [] })}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'board' && (
            <KanbanBoard tasks={displayTasks} />
          )}
          {viewMode === 'list' && (
            <TaskListView tasks={displayTasks} groupBy="status" />
          )}
          {viewMode === 'table' && (
            <TaskListView tasks={displayTasks} groupBy="none" />
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal />
    </>
  );
};

export default ProjectBoard;
