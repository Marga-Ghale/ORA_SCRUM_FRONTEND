import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import TaskCard from '../../components/tasks/TaskCard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import PageMeta from '../../components/common/PageMeta';
import { STATUS_COLUMNS, PRIORITY_CONFIG } from '../../types/project';
import { useAuth } from '../../components/UserProfile/AuthContext';

const MyTasks: React.FC = () => {
  const { tasks } = useProject();
  const { user } = useAuth();
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'dueDate'>('status');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get user's tasks
  const myTasks = tasks.filter(task => task.assignee?.id === user?.id);
  const filteredTasks = showCompleted ? myTasks : myTasks.filter(t => t.status !== 'done');

  // Stats
  const stats = {
    total: myTasks.length,
    todo: myTasks.filter(t => t.status === 'todo').length,
    inProgress: myTasks.filter(t => ['in_progress', 'in_review'].includes(t.status)).length,
    done: myTasks.filter(t => t.status === 'done').length,
    overdue: myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
  };

  // Group tasks
  const groupedTasks = () => {
    if (groupBy === 'status') {
      return STATUS_COLUMNS.map(status => ({
        id: status.id,
        title: status.name,
        color: status.color,
        tasks: filteredTasks.filter(t => t.status === status.id).sort((a, b) => a.order - b.order),
      })).filter(g => g.tasks.length > 0);
    }

    if (groupBy === 'priority') {
      return Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
        id: key,
        title: config.name,
        color: config.color,
        tasks: filteredTasks.filter(t => t.priority === key).sort((a, b) => a.order - b.order),
      })).filter(g => g.tasks.length > 0);
    }

    // Group by due date
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
        tasks: filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < today),
      },
      {
        id: 'today',
        title: 'Today',
        color: '#F59E0B',
        tasks: filteredTasks.filter(t => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          due.setHours(0, 0, 0, 0);
          return due.getTime() === today.getTime();
        }),
      },
      {
        id: 'tomorrow',
        title: 'Tomorrow',
        color: '#3B82F6',
        tasks: filteredTasks.filter(t => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          due.setHours(0, 0, 0, 0);
          return due.getTime() === tomorrow.getTime();
        }),
      },
      {
        id: 'thisWeek',
        title: 'This Week',
        color: '#10B981',
        tasks: filteredTasks.filter(t => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due > tomorrow && due <= nextWeek;
        }),
      },
      {
        id: 'later',
        title: 'Later',
        color: '#6B7280',
        tasks: filteredTasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) > nextWeek;
        }),
      },
      {
        id: 'noDue',
        title: 'No Due Date',
        color: '#9CA3AF',
        tasks: filteredTasks.filter(t => !t.dueDate),
      },
    ].filter(g => g.tasks.length > 0);
  };

  return (
    <>
      <PageMeta title="My Tasks | ORA SCRUM" description="View and manage your assigned tasks" />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {myTasks.length} tasks assigned to you
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Task</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">To Do</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">{stats.todo}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Done</p>
            <p className="text-2xl font-bold text-green-500 mt-1">{stats.done}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{stats.overdue}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Group by:</span>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {(['status', 'priority', 'dueDate'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setGroupBy(option)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    groupBy === option
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {option === 'dueDate' ? 'Due Date' : option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Show completed</span>
          </label>
        </div>

        {/* Task Groups */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
          {groupedTasks().map(group => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                <h3 className="font-semibold text-gray-900 dark:text-white">{group.title}</h3>
                <span className="text-sm text-gray-400">({group.tasks.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {showCompleted ? 'No tasks found' : 'All caught up!'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {showCompleted ? "You don't have any tasks assigned yet." : "You've completed all your tasks."}
              </p>
            </div>
          )}
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

export default MyTasks;