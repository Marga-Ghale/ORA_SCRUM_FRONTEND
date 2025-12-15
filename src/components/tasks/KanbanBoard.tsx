// src/components/tasks/KanbanBoard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskStatus, STATUS_COLUMNS } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal, ArrowUpDown, Calendar, EyeOff, Trash2 } from 'lucide-react';

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
      className="mb-2"
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
      className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <button
        onClick={() => { onSortByPriority(); onClose(); }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition-colors"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-400" />
        Sort by Priority
      </button>
      <button
        onClick={() => { onSortByDueDate(); onClose(); }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        Sort by Due Date
      </button>
      <div className="h-px bg-gray-100 dark:bg-gray-700 my-1.5" />
      <button
        onClick={() => { onHideColumn(); onClose(); }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition-colors"
      >
        <EyeOff className="w-4 h-4 text-gray-400" />
        Hide Column
      </button>
      {tasksCount > 0 && (
        <>
          <div className="h-px bg-gray-100 dark:bg-gray-700 my-1.5" />
          <button
            onClick={() => { onClearColumn(); onClose(); }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
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
    <div className="flex flex-col w-[280px] min-w-[280px] bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200/80 dark:border-gray-800/80">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200/80 dark:border-gray-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            {name}
          </h3>
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-gray-200/80 dark:bg-gray-700/80 text-xs font-medium text-gray-600 dark:text-gray-300">
            {sortedTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onAddTask(status)}
            className="p-1.5 rounded-md hover:bg-gray-200/80 dark:hover:bg-gray-700/50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md hover:bg-gray-200/80 dark:hover:bg-gray-700/50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
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
          flex-1 p-2 overflow-y-auto custom-scrollbar transition-colors duration-150
          ${isActive ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}
        `}
        style={{ maxHeight: 'calc(100vh - 260px)', minHeight: '120px' }}
      >
        {sortedTasks.length === 0 ? (
          <div
            className={`
              flex flex-col items-center justify-center h-[100px] border-2 border-dashed rounded-lg
              transition-all duration-150 cursor-pointer
              ${isActive
                ? 'border-brand-400 bg-brand-50/30 dark:bg-brand-900/10'
                : 'border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onClick={() => onAddTask(status)}
          >
            <Plus className="w-5 h-5 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {isActive ? 'Drop here' : 'Add task'}
            </span>
          </div>
        ) : (
          sortedTasks.map((task, index) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              index={index}
            />
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
  const {
    filters,
    moveTask,
    deleteTask,
    setIsCreateTaskModalOpen,
    setCreateTaskInitialStatus
  } = useProject();

  const [hiddenColumns, setHiddenColumns] = useState<Set<TaskStatus>>(new Set());

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.assignees.length > 0 && (!task.assignee || !filters.assignees.includes(task.assignee.id))) return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
    if (filters.types.length > 0 && !filters.types.includes(task.type)) return false;
    if (filters.labels.length > 0 && !task.labels.some(l => filters.labels.includes(l.id))) return false;
    return true;
  });

  const visibleColumns = STATUS_COLUMNS.filter(
    col => columns.includes(col.id) && !hiddenColumns.has(col.id)
  );

  const handleAddTask = (status: TaskStatus) => {
    setCreateTaskInitialStatus(status);
    setIsCreateTaskModalOpen(true);
  };

  const handleHideColumn = (status: TaskStatus) => {
    setHiddenColumns(prev => new Set([...prev, status]));
  };

  const handleClearColumn = (status: TaskStatus) => {
    const columnTasks = filteredTasks.filter(task => task.status === status);
    if (window.confirm(`Are you sure you want to delete ${columnTasks.length} tasks from "${status}"?`)) {
      columnTasks.forEach(task => deleteTask(task.id));
    }
  };

  const handleShowAllColumns = () => {
    setHiddenColumns(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden columns indicator */}
      {hiddenColumns.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {hiddenColumns.size} column{hiddenColumns.size > 1 ? 's' : ''} hidden
          </span>
          <button
            onClick={handleShowAllColumns}
            className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Show all
          </button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {visibleColumns.map(column => {
          const columnTasks = filteredTasks
            .filter(task => task.status === column.id)
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
