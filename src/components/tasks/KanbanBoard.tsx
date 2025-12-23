// src/components/tasks/KanbanBoard.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskStatus, STATUS_COLUMNS } from '../../types/project';
import TaskCard from './TaskCard';
import { MoreVertical, Plus, TrendingUp, Calendar, EyeOff, Trash2 } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import CreateTaskModal from './CreateTaskModal';

const ItemTypes = {
  TASK: 'task',
};

interface DraggableTaskCardProps {
  task: Task;
  index: number;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, index }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.TASK,
    item: () => ({ id: task.id, status: task.status, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={preview as unknown as React.Ref<HTMLDivElement>}
      className="mb-2.5 transition-transform"
    >
      <div
        ref={drag as unknown as React.Ref<HTMLDivElement>}
        style={{
          opacity: isDragging ? 0.4 : 1,
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.15s ease, opacity 0.15s ease',
        }}
      >
        <TaskCard task={task as any} isDragging={isDragging} />
      </div>
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
      className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <button
        onClick={() => {
          onSortByPriority();
          onClose();
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
      >
        <TrendingUp className="w-4 h-4 text-gray-400" />
        Sort by Priority
      </button>
      <button
        onClick={() => {
          onSortByDueDate();
          onClose();
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        Sort by Due Date
      </button>
      <div className="border-t border-gray-100 dark:border-gray-700 my-1.5" />
      <button
        onClick={() => {
          onHideColumn();
          onClose();
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
      >
        <EyeOff className="w-4 h-4 text-gray-400" />
        Hide Column
      </button>
      {tasksCount > 0 && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700 my-1.5" />
          <button
            onClick={() => {
              onClearColumn();
              onClose();
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
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
  const [isDropping, setIsDropping] = useState(false);

  useEffect(() => {
    setSortedTasks(tasks);
  }, [tasks]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: { id: string; status: TaskStatus; index: number }, monitor) => {
      if (!monitor.didDrop() && item.status !== status) {
        setIsDropping(true);
        // Immediately move task for instant feedback
        moveTask(item.id, status, sortedTasks.length);
        // Reset dropping state after animation
        setTimeout(() => setIsDropping(false), 300);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  const handleSortByPriority = () => {
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
      none: 4,
    };
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
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{name}</h3>
          <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400">
            {sortedTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTask(status)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
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
          flex-1 p-3 overflow-y-auto custom-scrollbar transition-all duration-200
          ${isActive ? 'bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500 ring-inset' : ''}
          ${isDropping ? 'bg-brand-50 dark:bg-brand-950/50' : ''}
        `}
        style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '200px' }}
      >
        {sortedTasks.length === 0 ? (
          <div
            className={`
              flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl
              transition-all duration-200 cursor-pointer group
              ${
                isActive
                  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }
            `}
            onClick={() => onAddTask(status)}
          >
            <Plus
              className={`w-6 h-6 mb-2 transition-all ${
                isActive
                  ? 'text-brand-500 scale-110'
                  : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-500'
              }`}
            />
            <span
              className={`text-sm font-medium transition-colors ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400'
              }`}
            >
              {isActive ? 'Drop task here' : 'Add a task'}
            </span>
          </div>
        ) : (
          <div className={`transition-all duration-200 ${isActive ? 'scale-[0.98]' : ''}`}>
            {sortedTasks.map((task, index) => (
              <DraggableTaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
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
    useProjectContext();

  const [hiddenColumns, setHiddenColumns] = useState<Set<TaskStatus>>(new Set());

  const filteredTasks = tasks.filter((task) => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    if (
      filters.assigneeIds.length > 0 &&
      (!task.assigneeIds || !task.assigneeIds.some((id) => filters.assigneeIds.includes(id as any)))
    )
      return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
    if (filters.types.length > 0 && !filters.types.includes(task.type)) return false;
    if (
      filters.labelIds.length > 0 &&
      (!task.labelIds || !task.labelIds.some((l) => filters.labelIds.includes(l as any)))
    )
      return false;
    return true;
  });

  const visibleColumns = STATUS_COLUMNS.filter(
    (col) => columns.includes(col.id) && !hiddenColumns.has(col.id)
  );

  const handleAddTask = useCallback(
    (status: TaskStatus) => {
      setCreateTaskInitialStatus(status);
      setIsCreateTaskModalOpen(true);
    },
    [setCreateTaskInitialStatus, setIsCreateTaskModalOpen]
  );

  const handleHideColumn = useCallback((status: TaskStatus) => {
    setHiddenColumns((prev) => new Set([...prev, status]));
  }, []);

  const handleClearColumn = useCallback(
    (status: TaskStatus) => {
      const columnTasks = filteredTasks.filter((task) => task.status === status);
      if (
        window.confirm(
          `Are you sure you want to delete ${columnTasks.length} task${columnTasks.length !== 1 ? 's' : ''} from "${status}"?`
        )
      ) {
        columnTasks.forEach((task) => deleteTask(task.id));
      }
    },
    [filteredTasks, deleteTask]
  );

  const handleShowAllColumns = useCallback(() => {
    setHiddenColumns(new Set());
  }, []);

  // Optimized move task handler
  const handleMoveTask = useCallback(
    (taskId: string, toStatus: TaskStatus, toIndex: number) => {
      moveTask(taskId, toStatus, toIndex);
    },
    [moveTask]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Hidden columns indicator */}
      {hiddenColumns.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-2 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
          <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {hiddenColumns.size} column{hiddenColumns.size !== 1 ? 's' : ''} hidden
          </span>
          <button
            onClick={handleShowAllColumns}
            className="ml-auto text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            Show All
          </button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {visibleColumns.map((column) => {
          const columnTasks = filteredTasks
            .filter((task) => task.status === column.id)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

          return (
            <KanbanColumn
              key={column.id}
              status={column.id}
              name={column.name}
              color={column.color}
              tasks={columnTasks}
              moveTask={handleMoveTask}
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
