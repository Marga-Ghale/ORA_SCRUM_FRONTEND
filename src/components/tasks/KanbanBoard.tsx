// src/components/tasks/KanbanBoard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskStatus, STATUS_COLUMNS } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import TaskCard from './TaskCard';

const ItemTypes = {
  TASK: 'task',
};

interface DraggableTaskCardProps {
  task: Task;
  index: number;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, index }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: { id: task.id, status: task.status, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="mb-3"
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
};

interface ColumnMenuProps {
  isOpen: boolean;
  onClose: () => void;
  status: TaskStatus;
  tasksCount: number;
  onClearColumn: () => void;
  onHideColumn: () => void;
  onSortByPriority: () => void;
  onSortByDueDate: () => void;
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({
  isOpen,
  onClose,
  status,
  tasksCount,
  onClearColumn,
  onHideColumn,
  onSortByPriority,
  onSortByDueDate,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
    >
      <button
        onClick={() => {
          onSortByPriority();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        Sort by Priority
      </button>
      <button
        onClick={() => {
          onSortByDueDate();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Sort by Due Date
      </button>
      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
      <button
        onClick={() => {
          onHideColumn();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
        Hide Column
      </button>
      {tasksCount > 0 && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <button
            onClick={() => {
              onClearColumn();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear Column ({tasksCount})
          </button>
        </>
      )}
    </div>
  );
};

interface KanbanColumnProps {
  status: TaskStatus;
  name: string;
  color: string;
  tasks: Task[];
  moveTask: (taskId: string, toStatus: TaskStatus, toIndex: number) => void;
  onAddTask: (status: TaskStatus) => void;
  onHideColumn: (status: TaskStatus) => void;
  onClearColumn: (status: TaskStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  name,
  color,
  tasks,
  moveTask,
  onAddTask,
  onHideColumn,
  onClearColumn,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortedTasks, setSortedTasks] = useState<Task[]>(tasks);

  // Update sorted tasks when tasks prop changes
  useEffect(() => {
    setSortedTasks(tasks);
  }, [tasks]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: { id: string; status: TaskStatus; index: number }) => {
      if (item.status !== status) {
        moveTask(item.id, status, sortedTasks.length);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  const handleSortByPriority = () => {
    const priorityOrder = { highest: 0, high: 1, medium: 2, low: 3, lowest: 4 };
    const sorted = [...sortedTasks].sort(
      (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    );
    setSortedTasks(sorted);
  };

  const handleSortByDueDate = () => {
    const sorted = [...sortedTasks].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    setSortedTasks(sorted);
  };

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px] bg-gray-50 dark:bg-gray-900 rounded-xl">
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 pb-2 relative">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{name}</h3>
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            {sortedTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTask(status)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Add task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="More options"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            <ColumnMenu
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              status={status}
              tasksCount={sortedTasks.length}
              onClearColumn={() => onClearColumn(status)}
              onHideColumn={() => onHideColumn(status)}
              onSortByPriority={handleSortByPriority}
              onSortByDueDate={handleSortByDueDate}
            />
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className={`
          flex-1 p-3 pt-2 overflow-y-auto custom-scrollbar transition-colors duration-200
          ${isActive ? 'bg-brand-50 dark:bg-brand-900/20' : ''}
        `}
        style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '200px' }}
      >
        {sortedTasks.length === 0 ? (
          <div
            className={`
              flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg
              transition-colors duration-200 cursor-pointer
              ${
                isActive
                  ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onClick={() => onAddTask(status)}
          >
            <svg
              className="w-6 h-6 text-gray-400 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {isActive ? 'Drop here' : 'Add task'}
            </span>
          </div>
        ) : (
          sortedTasks.map((task, index) => (
            <DraggableTaskCard key={task.id} task={task} index={index} />
          ))
        )}
      </div>
    </div>
  );
};

interface KanbanBoardProps {
  tasks: Task[];
  columns?: TaskStatus[];
}

const KanbanBoardContent: React.FC<KanbanBoardProps> = ({
  tasks,
  columns = ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
}) => {
  const { filters, moveTask, deleteTask, setIsCreateTaskModalOpen, setCreateTaskInitialStatus } =
    useProject();

  const [hiddenColumns, setHiddenColumns] = useState<Set<TaskStatus>>(new Set());

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter((task) => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    if (
      filters.assignees.length > 0 &&
      (!task.assignee || !filters.assignees.includes(task.assignee.id))
    )
      return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
    if (filters.types.length > 0 && !filters.types.includes(task.type)) return false;
    if (filters.labels.length > 0 && !task.labels.some((l) => filters.labels.includes(l.id)))
      return false;
    return true;
  });

  const visibleColumns = STATUS_COLUMNS.filter(
    (col) => columns.includes(col.id) && !hiddenColumns.has(col.id)
  );

  const handleAddTask = (status: TaskStatus) => {
    setCreateTaskInitialStatus(status);
    setIsCreateTaskModalOpen(true);
  };

  const handleHideColumn = (status: TaskStatus) => {
    setHiddenColumns((prev) => new Set([...prev, status]));
  };

  const handleClearColumn = (status: TaskStatus) => {
    const columnTasks = filteredTasks.filter((task) => task.status === status);
    if (
      window.confirm(
        `Are you sure you want to delete ${columnTasks.length} tasks from "${status}"?`
      )
    ) {
      columnTasks.forEach((task) => deleteTask(task.id));
    }
  };

  const handleShowAllColumns = () => {
    setHiddenColumns(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden columns indicator */}
      {hiddenColumns.size > 0 && (
        <div className="flex items-center gap-2 mb-4 px-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {hiddenColumns.size} column(s) hidden
          </span>
          <button
            onClick={handleShowAllColumns}
            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
          >
            Show all
          </button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {visibleColumns.map((column) => {
          const columnTasks = filteredTasks
            .filter((task) => task.status === column.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <KanbanColumn
              key={column.id}
              status={column.id}
              name={column.name}
              color={column.color}
              tasks={columnTasks}
              moveTask={moveTask}
              onAddTask={handleAddTask}
              onHideColumn={handleHideColumn}
              onClearColumn={handleClearColumn}
            />
          );
        })}
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = (props) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <KanbanBoardContent {...props} />
    </DndProvider>
  );
};

export default KanbanBoard;
