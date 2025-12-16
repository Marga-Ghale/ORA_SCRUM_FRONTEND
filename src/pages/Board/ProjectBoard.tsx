import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, LayoutGrid, List, Table, X, UserPlus } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import TaskListView from '../../components/tasks/TaskListView';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import AddProjectMemberModal from '../../components/modals/AddProjectMemberModal';
import PageMeta from '../../components/common/PageMeta';
import { useProjectUsers } from '../../hooks/useUser';

const ProjectBoard: React.FC = () => {
  const {
    tasks,
    currentProject,
    currentWorkspace,
    currentSprint,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    setIsCreateTaskModalOpen,
    setCreateTaskInitialStatus,
  } = useProject();

  // Fetch real users from project API
  const { data: projectUsers } = useProjectUsers(currentProject?.id || '');
  const users = projectUsers || [];

  const [showFilters, setShowFilters] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Get tasks for current sprint or all tasks
  const displayTasks = currentSprint
    ? tasks.filter(
        (t) =>
          currentSprint.tasks.some((st) => st.id === t.id) ||
          ['todo', 'in_progress', 'in_review', 'done'].includes(t.status)
      )
    : tasks;

  // View options with lucide icons
  const viewOptions = [
    { id: 'board' as const, label: 'Board', icon: LayoutGrid },
    { id: 'list' as const, label: 'List', icon: List },
    { id: 'table' as const, label: 'Table', icon: Table },
  ];

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.assignees.length) count += filters.assignees.length;
    if (filters.priorities.length) count += filters.priorities.length;
    if (filters.types.length) count += filters.types.length;
    if (filters.labels.length) count += filters.labels.length;
    return count;
  }, [filters]);

  // Get priority options from config
  const priorityOptions = Object.keys(PRIORITY_CONFIG).filter((p) => p !== 'none');

  // Get type options from config
  const typeOptions = Object.keys(TASK_TYPE_CONFIG).filter((t) => t !== 'subtask');

  // Visible user avatars count
  const visibleUserCount = Math.min(users.length, 5);
  const remainingUserCount = Math.max(0, users.length - visibleUserCount);

  return (
    <>
      <PageMeta
        title={`${currentProject?.name || 'Project'} Board | ORA SCRUM`}
        description="Project management board"
      />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <span>{currentProject?.key || 'PROJECT'}</span>
              <span>/</span>
              <span>{currentSprint?.name || 'All Tasks'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentProject?.name || 'Project Board'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Member Button */}
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>

            {/* Add Task Button */}
            <button
              onClick={() => {
                setCreateTaskInitialStatus('todo');
                setIsCreateTaskModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors relative
                ${
                  activeFilterCount > 0
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Assignee Filter */}
            {users.length > 0 && (
              <div className="flex -space-x-2">
                {users.slice(0, visibleUserCount).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        assignees: prev.assignees.includes(user.id)
                          ? prev.assignees.filter((id) => id !== user.id)
                          : [...prev.assignees, user.id],
                      }));
                    }}
                    className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-all hover:z-10
                      ${
                        filters.assignees.includes(user.id)
                          ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800 z-10'
                          : 'border-white dark:border-gray-800 hover:border-gray-300'
                      }
                    `}
                    title={user.name}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}
                  </button>
                ))}
                {remainingUserCount > 0 && (
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={`${remainingUserCount} more team members`}
                  >
                    +{remainingUserCount}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right side - View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setViewMode(option.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${
                      viewMode === option.id
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((priority) => {
                    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
                    return (
                      <button
                        key={priority}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            priorities: prev.priorities.includes(priority)
                              ? prev.priorities.filter((p) => p !== priority)
                              : [...prev.priorities, priority],
                          }));
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-all
                          ${
                            filters.priorities.includes(priority)
                              ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 ring-2 ring-brand-200 dark:ring-brand-800'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        {config.icon} {config.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((type) => {
                    const config = TASK_TYPE_CONFIG[type as keyof typeof TASK_TYPE_CONFIG];
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            types: prev.types.includes(type)
                              ? prev.types.filter((t) => t !== type)
                              : [...prev.types, type],
                          }));
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-all
                          ${
                            filters.types.includes(type)
                              ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 ring-2 ring-brand-200 dark:ring-brand-800'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        {config.icon} {config.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Assignees ({users.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {users.slice(0, 4).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          assignees: prev.assignees.includes(user.id)
                            ? prev.assignees.filter((id) => id !== user.id)
                            : [...prev.assignees, user.id],
                        }));
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1
                        ${
                          filters.assignees.includes(user.id)
                            ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 ring-2 ring-brand-200 dark:ring-brand-800'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[8px] flex items-center justify-center">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      )}
                      {user.name.split(' ')[0]}
                    </button>
                  ))}
                  {users.length > 4 && (
                    <span className="px-2.5 py-1 text-xs text-gray-500">
                      +{users.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({ search: '', assignees: [], priorities: [], labels: [], types: [] })
                  }
                  disabled={activeFilterCount === 0}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'board' && <KanbanBoard tasks={displayTasks} />}
          {viewMode === 'list' && <TaskListView tasks={displayTasks} groupBy="status" />}
          {viewMode === 'table' && <TaskListView tasks={displayTasks} groupBy="none" />}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal />

      {/* Add Member Modal */}
      <AddProjectMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        workspaceId={currentWorkspace?.id || ''}
        projectId={currentProject?.id || ''}
        projectName={currentProject?.name}
      />
    </>
  );
};

export default ProjectBoard;
