import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useProject } from '../../context/ProjectContext';
import { Task, Sprint, PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types/project';
import PageMeta from '../../components/common/PageMeta';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';

const ItemTypes = {
  TASK: 'backlog-task',
};

interface DraggableBacklogItemProps {
  task: Task;
  onOpenTask: (task: Task) => void;
}

const DraggableBacklogItem: React.FC<DraggableBacklogItemProps> = ({ task, onOpenTask }) => {
  const typeConfig = TASK_TYPE_CONFIG[task.type];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: { id: task.id, task },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      onClick={() => onOpenTask(task)}
      className={`
        flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        rounded-lg cursor-pointer hover:border-brand-300 dark:hover:border-brand-600 transition-all
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="text-gray-400 cursor-grab">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Type Icon */}
      <span
        className="flex items-center justify-center w-6 h-6 rounded text-sm flex-shrink-0"
        style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
      >
        {typeConfig.icon}
      </span>

      {/* Key */}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">
        {task.key}
      </span>

      {/* Title */}
      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
        {task.title}
      </span>

      {/* Priority */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: priorityConfig.color }}
        title={priorityConfig.name}
      />

      {/* Story Points */}
      {task.storyPoints && (
        <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
          {task.storyPoints}
        </span>
      )}

      {/* Assignee */}
      {task.assignee ? (
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
          {task.assignee.avatar ? (
            <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
              {task.assignee.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex-shrink-0" />
      )}
    </div>
  );
};

interface SprintSectionProps {
  sprint: Sprint;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const SprintSection: React.FC<SprintSectionProps> = ({
  sprint,
  tasks,
  onOpenTask,
  isExpanded,
  onToggle,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: { id: string; task: Task }) => {
      // Move task to this sprint
      console.log('Move task', item.id, 'to sprint', sprint.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const statusColor = sprint.status === 'active' ? '#10B981' : sprint.status === 'completed' ? '#6B7280' : '#3B82F6';

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`mb-4 rounded-xl border transition-colors ${
        isOver ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Sprint Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-t-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <h3 className="font-semibold text-gray-900 dark:text-white">{sprint.name}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({tasks.length} issues)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </span>
          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium">
            {totalPoints} pts
          </span>
          {sprint.status === 'planning' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Start sprint logic
              }}
              className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start Sprint
            </button>
          )}
          {sprint.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Complete sprint logic
              }}
              className="px-3 py-1 bg-success-500 hover:bg-success-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Complete Sprint
            </button>
          )}
        </div>
      </div>

      {/* Sprint Content */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {sprint.goal && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Goal: {sprint.goal}
            </p>
          )}
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No issues in this sprint</p>
              <p className="text-sm">Drag issues here to add them</p>
            </div>
          ) : (
            tasks.map(task => (
              <DraggableBacklogItem key={task.id} task={task} onOpenTask={onOpenTask} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const BacklogContent: React.FC = () => {
  const {
    tasks,
    openTaskModal,
    setIsCreateSprintModalOpen,
    setIsCreateTaskModalOpen,
    setCreateTaskInitialStatus,
    startSprint,
    completeSprint,
  } = useProject();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sprint-2', 'backlog']));

  // Mock sprints data
  const sprints: Sprint[] = [
    {
      id: 'sprint-2',
      name: 'Sprint 2 - Core Features',
      goal: 'Implement Kanban board and task management',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'active',
      tasks: [],
    },
    {
      id: 'sprint-3',
      name: 'Sprint 3 - Polish',
      goal: 'UI improvements and performance optimization',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      status: 'planning',
      tasks: [],
    },
  ];

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const backlogTasks = tasks.filter(t => t.status === 'backlog');
  const sprintTasks = tasks.filter(t => t.status !== 'backlog');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backlog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Plan and prioritize your upcoming work
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateSprintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Create Sprint</span>
          </button>
          <button
            onClick={() => {
              setCreateTaskInitialStatus('backlog');
              setIsCreateTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Issue</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{tasks.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Backlog</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{backlogTasks.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Sprint</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{sprintTasks.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Story Points</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Active/Upcoming Sprints */}
        {sprints.map(sprint => (
          <SprintSection
            key={sprint.id}
            sprint={sprint}
            tasks={sprint.status === 'active' ? sprintTasks : []}
            onOpenTask={openTaskModal}
            isExpanded={expandedSections.has(sprint.id)}
            onToggle={() => toggleSection(sprint.id)}
          />
        ))}

        {/* Backlog */}
        <div
          className={`rounded-xl border transition-colors ${
            'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div
            onClick={() => toggleSection('backlog')}
            className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-t-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('backlog') ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Backlog</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({backlogTasks.length} issues)
              </span>
            </div>
            <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium">
              {backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} pts
            </span>
          </div>

          {expandedSections.has('backlog') && (
            <div className="p-4 space-y-2">
              {backlogTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Backlog is empty</p>
                  <p className="text-sm">Create new issues to add to the backlog</p>
                </div>
              ) : (
                backlogTasks.map(task => (
                  <DraggableBacklogItem key={task.id} task={task} onOpenTask={openTaskModal} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Backlog: React.FC = () => {
  return (
    <>
      <PageMeta title="Backlog | ORA SCRUM" description="Manage your product backlog" />
      <DndProvider backend={HTML5Backend}>
        <BacklogContent />
      </DndProvider>
      <TaskDetailModal />
    </>
  );
};

export default Backlog;
