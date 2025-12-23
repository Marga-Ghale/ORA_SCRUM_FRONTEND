// src/pages/ProjectBoard/ProjectBoard.tsx
import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Table,
  X,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import TaskListView from '../../components/tasks/TaskListView';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import AddProjectMemberModal from '../../components/modals/AddProjectMemberModal';
import PageMeta from '../../components/common/PageMeta';
import { useEffectiveMembers } from '../../hooks/api/useMembers';

const ProjectBoard: React.FC = () => {
  const {
    tasks,
    tasksLoading,
    currentProject,
    currentWorkspace,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    setIsCreateTaskModalOpen,
    setCreateTaskInitialStatus,
  } = useProject();

  const { data: projectMembers } = useEffectiveMembers('project', currentProject?.id || '', {
    enabled: !!currentProject?.id,
  });

  const users = useMemo(() => {
    if (!projectMembers) return [];
    return projectMembers.map((member) => ({
      id: member.userId,
      name: member.user?.name || 'Unknown',
      email: member.user?.email || '',
      avatar: member.user?.avatar,
      role: member.role,
    }));
  }, [projectMembers]);

  const [showFilters, setShowFilters] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const displayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.assigneeIds.length > 0) {
        const hasAssignee = task.assigneeIds?.some((id) => filters.assigneeIds.includes(id as any));
        if (!hasAssignee) return false;
      }

      if (filters.priorities.length > 0) {
        if (!filters.priorities.includes(task.priority)) return false;
      }

      if (filters.types.length > 0) {
        if (!filters.types.includes(task.type)) return false;
      }

      if (filters.labelIds.length > 0) {
        const hasLabel = task.labelIds?.some((id) => filters.labelIds.includes(id as any));
        if (!hasLabel) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  const viewOptions = [
    { id: 'board' as const, label: 'Board', icon: LayoutGrid },
    { id: 'list' as const, label: 'List', icon: List },
    { id: 'table' as const, label: 'Table', icon: Table },
  ];

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.assigneeIds.length) count += filters.assigneeIds.length;
    if (filters.priorities.length) count += filters.priorities.length;
    if (filters.types.length) count += filters.types.length;
    if (filters.labelIds.length) count += filters.labelIds.length;
    return count;
  }, [filters]);

  const priorityOptions = Object.keys(PRIORITY_CONFIG).filter((p) => p !== 'none');
  const typeOptions = Object.keys(TASK_TYPE_CONFIG).filter((t) => t !== 'subtask');

  const visibleUserCount = Math.min(users.length, 5);
  const remainingUserCount = Math.max(0, users.length - visibleUserCount);

  return (
    <>
      <PageMeta
        title={`${currentProject?.name || 'Project'} Board | ORA SCRUM`}
        description="Project management board"
      />

      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
        {/* Header - Professional gradient background */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span className="font-semibold">{currentProject?.key || 'PROJECT'}</span>
                  <ChevronDown className="w-3 h-3" />
                  <span>All Tasks</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentProject?.name || 'Project Board'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Member</span>
                </button>

                <button
                  onClick={() => {
                    setCreateTaskInitialStatus('backlog');
                    setIsCreateTaskModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Task</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left side */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-9 pr-8 py-2 w-64 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    activeFilterCount > 0
                      ? 'border-2 border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 min-w-[20px] h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Quick Assignee Filter */}
                {users.length > 0 && (
                  <div className="flex items-center gap-1">
                    {users.slice(0, visibleUserCount).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setFilters(
                            (prev) =>
                              ({
                                ...prev,
                                assigneeIds: prev.assigneeIds.includes(user.id as any)
                                  ? prev.assigneeIds.filter((id) => id !== (user.id as any))
                                  : [...prev.assigneeIds, user.id],
                              }) as any
                          );
                        }}
                        className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
                          filters.assigneeIds.includes(user.id as any)
                            ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                            : 'opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        title={user.name}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white">
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
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all hover:scale-105"
                      >
                        +{remainingUserCount}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right side - View Toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                {viewOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setViewMode(option.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === option.id
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mx-6 mt-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-1.5">
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
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          filters.priorities.includes(priority)
                            ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {config.icon} {config.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Type
                </label>
                <div className="flex flex-wrap gap-1.5">
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
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          filters.types.includes(type)
                            ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {config.icon} {config.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Assignees ({users.length})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {users.slice(0, 4).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setFilters(
                          (prev) =>
                            ({
                              ...prev,
                              assigneeIds: prev.assigneeIds.includes(user.id as any)
                                ? prev.assigneeIds.filter((id) => id !== (user.id as any))
                                : [...prev.assigneeIds, user.id],
                            }) as any
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        filters.assigneeIds.includes(user.id as any)
                          ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[8px] flex items-center justify-center font-bold">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                      )}
                      {user.name.split(' ')[0]}
                    </button>
                  ))}
                  {users.length > 4 && (
                    <span className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                      +{users.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({
                      search: '',
                      assigneeIds: [],
                      priorities: [],
                      labelIds: [],
                      types: [],
                    })
                  }
                  disabled={activeFilterCount === 0}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden py-5">
          {tasksLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading tasks...</p>
              </div>
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Search className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {activeFilterCount > 0
                    ? 'Try adjusting your filters to see more results'
                    : 'Get started by creating your first task'}
                </p>
                {activeFilterCount === 0 && (
                  <button
                    onClick={() => {
                      setCreateTaskInitialStatus('todo');
                      setIsCreateTaskModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Task
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full">
              {viewMode === 'board' && <KanbanBoard tasks={displayTasks} />}
              {viewMode === 'list' && <TaskListView tasks={displayTasks as any} groupBy="status" />}
              {viewMode === 'table' && <TaskListView tasks={displayTasks as any} groupBy="none" />}
            </div>
          )}
        </div>
      </div>

      <TaskDetailModal />

      {currentWorkspace && currentProject && (
        <AddProjectMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          workspaceId={currentWorkspace.id}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}
    </>
  );
};

export default ProjectBoard;
