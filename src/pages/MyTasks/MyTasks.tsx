// MyTasks.tsx - Fixed Version
import React, { useState, useMemo } from 'react';
import {
  Plus,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  Filter,
  Search,
  Calendar,
  Target,
  TrendingUp,
  ChevronDown,
  X,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import TaskCard from '../../components/tasks/TaskCard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import PageMeta from '../../components/common/PageMeta';
import { STATUS_COLUMNS, PRIORITY_CONFIG, Priority } from '../../types/project';
import { useMyTasks, TaskResponse } from '../../hooks/api/useTasks';

type GroupByOption = 'status' | 'priority' | 'dueDate';
type ViewMode = 'grid' | 'list';
type SortOrder = 'asc' | 'desc';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  trend?: number;
  onClick?: () => void;
  isActive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color,
  bgColor,
  trend,
  onClick,
  isActive,
}) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl p-4 cursor-pointer
      border transition-all duration-300 ease-out
      hover:shadow-lg hover:-translate-y-0.5
      ${
        isActive
          ? 'border-brand-500 dark:border-brand-400 ring-2 ring-brand-500/20 dark:ring-brand-400/20'
          : 'border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600'
      }
      bg-white dark:bg-gray-800/80 backdrop-blur-sm
    `}
  >
    <div
      className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 blur-xl"
      style={{ backgroundColor: color }}
    />

    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${bgColor}`}>{icon}</div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
          >
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  </div>
);

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 text-sm font-medium rounded-full border border-brand-200/60 dark:border-brand-800/40 animate-in fade-in slide-in-from-left-2 duration-200">
    {label}
    <button
      onClick={onRemove}
      className="p-0.5 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-full transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

const MyTasks: React.FC = () => {
  const { data: myTasks = [], isLoading } = useMyTasks();

  // View & filter state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [groupBy, setGroupBy] = useState<GroupByOption>('status');
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let tasks = showCompleted ? myTasks : myTasks.filter((t) => t.status !== 'done');

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query)
      );
    }

    if (priorityFilter) {
      tasks = tasks.filter((t) => t.priority === priorityFilter);
    }

    return tasks;
  }, [myTasks, showCompleted, searchQuery, priorityFilter]);

  // Stats calculation
  const stats = useMemo(
    () => ({
      total: myTasks.length,
      todo: myTasks.filter((t) => t.status === 'todo').length,
      inProgress: myTasks.filter((t) => ['in_progress', 'in_review'].includes(t.status)).length,
      done: myTasks.filter((t) => t.status === 'done').length,
      overdue: myTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      ).length,
    }),
    [myTasks]
  );

  // Active filters count
  const activeFiltersCount = [searchQuery, priorityFilter, !showCompleted].filter(Boolean).length;

  // Grouping logic
  const groupedTasks = useMemo(() => {
    const sortTasks = (tasks: TaskResponse[]) => {
      return [...tasks].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        return (a.position - b.position) * multiplier;
      });
    };

    if (groupBy === 'status') {
      return STATUS_COLUMNS.map((status) => ({
        id: status.id,
        title: status.name,
        color: status.color,
        tasks: sortTasks(filteredTasks.filter((t) => t.status === status.id)),
      })).filter((g) => g.tasks.length > 0);
    }

    if (groupBy === 'priority') {
      const priorityOrder = ['critical', 'high', 'medium', 'low'];
      return priorityOrder
        .map((key) => {
          const config = PRIORITY_CONFIG[key as Priority];
          return {
            id: key,
            title: config?.name || key,
            color: config?.color || '#6B7280',
            tasks: sortTasks(filteredTasks.filter((t) => t.priority === key)),
          };
        })
        .filter((g) => g.tasks.length > 0);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      {
        id: 'overdue',
        title: 'Overdue',
        color: '#EF4444',
        icon: <AlertCircle className="w-4 h-4" />,
        tasks: sortTasks(
          filteredTasks.filter(
            (t) => t.dueDate && new Date(t.dueDate) < today && t.status !== 'done'
          )
        ),
      },
      {
        id: 'today',
        title: 'Today',
        color: '#F59E0B',
        icon: <Target className="w-4 h-4" />,
        tasks: sortTasks(
          filteredTasks.filter((t) => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            due.setHours(0, 0, 0, 0);
            return due.getTime() === today.getTime();
          })
        ),
      },
      {
        id: 'tomorrow',
        title: 'Tomorrow',
        color: '#3B82F6',
        icon: <Calendar className="w-4 h-4" />,
        tasks: sortTasks(
          filteredTasks.filter((t) => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            due.setHours(0, 0, 0, 0);
            return due.getTime() === tomorrow.getTime();
          })
        ),
      },
      {
        id: 'thisWeek',
        title: 'This Week',
        color: '#10B981',
        tasks: sortTasks(
          filteredTasks.filter((t) => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due > tomorrow && due <= nextWeek;
          })
        ),
      },
      {
        id: 'later',
        title: 'Later',
        color: '#6B7280',
        tasks: sortTasks(filteredTasks.filter((t) => t.dueDate && new Date(t.dueDate) > nextWeek)),
      },
      {
        id: 'noDue',
        title: 'No Due Date',
        color: '#9CA3AF',
        tasks: sortTasks(filteredTasks.filter((t) => !t.dueDate)),
      },
    ].filter((g) => g.tasks.length > 0);
  }, [filteredTasks, groupBy, sortOrder]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setPriorityFilter(null);
    setShowCompleted(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Loading your tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="My Tasks | ORA SCRUM" description="View and manage your assigned tasks" />

      <div className="flex flex-col h-full max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              My Tasks
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400">
              {filteredTasks.length === myTasks.length
                ? `${myTasks.length} tasks assigned to you`
                : `Showing ${filteredTasks.length} of ${myTasks.length} tasks`}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="
              inline-flex items-center gap-2.5 px-5 py-2.5
              bg-gradient-to-r from-brand-500 to-brand-600 
              hover:from-brand-600 hover:to-brand-700
              text-white rounded-xl text-sm font-semibold 
              transition-all duration-300
              shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30
              hover:-translate-y-0.5 active:translate-y-0
            "
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={<ClipboardList className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
            label="Total Tasks"
            value={stats.total}
            color="#374151"
            bgColor="bg-gray-100 dark:bg-gray-700"
          />
          <StatCard
            icon={<ClipboardList className="w-5 h-5 text-blue-500" />}
            label="To Do"
            value={stats.todo}
            color="#3B82F6"
            bgColor="bg-blue-50 dark:bg-blue-950/30"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            label="In Progress"
            value={stats.inProgress}
            color="#F59E0B"
            bgColor="bg-amber-50 dark:bg-amber-950/30"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            label="Completed"
            value={stats.done}
            color="#10B981"
            bgColor="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5 text-red-500" />}
            label="Overdue"
            value={stats.overdue}
            color="#EF4444"
            bgColor="bg-red-50 dark:bg-red-950/30"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2.5 
                  bg-white dark:bg-gray-800/80
                  border border-gray-200 dark:border-gray-700
                  rounded-xl text-sm
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                  transition-all duration-200
                "
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filter & View Controls */}
            <div className="flex items-center gap-3">
              {/* Group By */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">
                  Group:
                </span>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  {(['status', 'priority', 'dueDate'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setGroupBy(option)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium 
                        transition-all duration-200
                        ${
                          groupBy === option
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      {option === 'dueDate'
                        ? 'Due'
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={sortOrder === 'asc' ? 'Sorted ascending' : 'Sorted descending'}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <SortDesc className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium 
                    border transition-all duration-200
                    ${
                      activeFiltersCount > 0
                        ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-brand-500 text-white rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Filter Dropdown Panel */}
                {isFilterOpen && (
                  <div
                    className="
                      absolute right-0 top-full mt-2 w-72 p-4
                      bg-white dark:bg-gray-800 
                      border border-gray-200 dark:border-gray-700 
                      rounded-2xl shadow-xl dark:shadow-2xl
                      z-50
                      animate-in fade-in slide-in-from-top-2 duration-200
                    "
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Priority Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() =>
                              setPriorityFilter((prev) => (prev === key ? null : (key as Priority)))
                            }
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-semibold
                              border transition-all duration-200
                              ${
                                priorityFilter === key
                                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}
                            style={{
                              backgroundColor:
                                priorityFilter === key ? `${config.color}15` : undefined,
                              color: priorityFilter === key ? config.color : undefined,
                            }}
                          >
                            {config.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Show Completed Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showCompleted}
                          onChange={(e) => setShowCompleted(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`
                            w-10 h-6 rounded-full transition-colors duration-200
                            ${showCompleted ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}
                          `}
                        />
                        <div
                          className={`
                            absolute top-1 left-1 w-4 h-4 bg-white rounded-full 
                            transition-transform duration-200 shadow-sm
                            ${showCompleted ? 'translate-x-4' : ''}
                          `}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show completed tasks
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
              {searchQuery && (
                <FilterBadge
                  label={`Search: "${searchQuery}"`}
                  onRemove={() => setSearchQuery('')}
                />
              )}
              {priorityFilter && (
                <FilterBadge
                  label={`Priority: ${PRIORITY_CONFIG[priorityFilter]?.name}`}
                  onRemove={() => setPriorityFilter(null)}
                />
              )}
              {!showCompleted && (
                <FilterBadge label="Hide completed" onRemove={() => setShowCompleted(true)} />
              )}
            </div>
          )}
        </div>

        {/* Task Groups */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-8">
          {groupedTasks.map((group, groupIndex) => (
            <div
              key={group.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${groupIndex * 100}ms` }}
            >
              {/* Group Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full ring-4 ring-opacity-20"
                  style={{
                    backgroundColor: group.color,
                    boxShadow: `0 0 0 4px ${group.color}20`,
                  }}
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{group.title}</h3>
                <span className="px-2.5 py-0.5 text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                  {group.tasks.length}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
              </div>

              {/* Tasks Grid/List */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'flex flex-col gap-3'
                }
              >
                {group.tasks.map((task, taskIndex) => (
                  <div
                    key={task.id}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${groupIndex * 100 + taskIndex * 50}ms` }}
                  >
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-lg">🎉</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {showCompleted ? 'No tasks found' : 'All caught up!'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                {showCompleted
                  ? "You don't have any tasks matching your filters."
                  : "Amazing work! You've completed all your tasks. Time for a coffee break? ☕"}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 rounded-xl transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close filter dropdown */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
      )}

      {/* Modals */}
      <TaskDetailModal />
      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

export default MyTasks;
