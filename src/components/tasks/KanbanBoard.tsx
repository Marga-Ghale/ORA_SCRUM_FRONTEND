import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskStatus, STATUS_COLUMNS } from '../../types/project';
import TaskCard from './TaskCard';
import { MoreVertical, Plus, TrendingUp, Calendar, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../modals/ConfirmModal';
import { useDeleteTask, useUpdateTaskPositionAndStatus } from '../../hooks/api/useTasks';

const getErrorMessage = (error: any): string => {
  return error?.message || 'An unexpected error occurred';
};

const ItemTypes = { TASK: 'task' };

interface DragItem {
  id: string;
  status: TaskStatus;
  index: number;
  fromColumn: TaskStatus;
  type: string;
  parentTaskId?: string;
  hasSubtasks: boolean;
  subtaskIds: string[];
}

// ============================================
// DROP ZONE COMPONENT (Between Tasks)
// ============================================

interface DropZoneProps {
  status: TaskStatus;
  index: number;
  onDrop: (item: DragItem) => void;
  isEmptyColumn?: boolean;
  onAddTask?: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({ status, index, onDrop, isEmptyColumn, onAddTask }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: DragItem, monitor) => {
      if (!monitor.didDrop()) {
        onDrop({ ...item, status, index });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  if (isEmptyColumn) {
    return (
      <div ref={drop} className="h-full min-h-[160px]">
        <div
          className={`flex flex-col items-center justify-center h-full border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${
            isActive
              ? 'border-brand-400 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.02]'
              : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
          }`}
          onClick={onAddTask}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
              isActive
                ? 'bg-brand-100 dark:bg-brand-900/50 scale-110'
                : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50'
            }`}
          >
            <Plus
              className={`w-5 h-5 transition-all duration-200 ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-400 dark:text-gray-600 group-hover:text-brand-500 dark:group-hover:text-brand-400'
              }`}
            />
          </div>
          <span
            className={`text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'text-brand-700 dark:text-brand-300 font-semibold'
                : 'text-gray-500 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-brand-400'
            }`}
          >
            {isActive ? 'Drop here to add' : 'Add task'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            Click or drag to create
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={drop}
      className={`transition-all duration-200 ease-out ${isActive ? 'h-12 my-2' : 'h-2'}`}
    >
      {isActive && (
        <div className="h-full rounded-lg bg-gradient-to-r from-brand-500/10 via-brand-500/20 to-brand-500/10 dark:from-brand-400/10 dark:via-brand-400/20 dark:to-brand-400/10 border-2 border-dashed border-brand-500 dark:border-brand-400 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-pulse" />
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              Drop here
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// DRAGGABLE TASK CARD
// ============================================

interface DraggableTaskCardProps {
  task: Task;
  index: number;
  status: TaskStatus;
  allTasks: Task[];
  isSubtask?: boolean;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  index,
  status,
  allTasks,
  isSubtask = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Find subtasks of this task
  const subtasks = allTasks.filter((t) => t.parentTaskId === task.id);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: (): DragItem => ({
      id: task.id,
      index,
      status,
      fromColumn: status,
      type: ItemTypes.TASK,
      parentTaskId: task.parentTaskId,
      hasSubtasks: subtasks.length > 0,
      subtaskIds: subtasks.map((s) => s.id),
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  return (
    <div
      ref={ref}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-30 scale-95 rotate-2' : 'opacity-100 scale-100 rotate-0'
      } ${isSubtask ? 'ml-8' : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <TaskCard task={task as any} isDragging={isDragging} />
    </div>
  );
};

// ============================================
// COLUMN MENU
// ============================================

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

export const ColumnMenu: React.FC<ColumnMenuProps> = ({
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
      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <button
        onClick={() => {
          onSortByPriority();
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
      >
        <TrendingUp className="w-4 h-4 text-gray-400" />
        Sort by Priority
      </button>
      <button
        onClick={() => {
          onSortByDueDate();
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        Sort by Due Date
      </button>
      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
      <button
        onClick={() => {
          onHideColumn();
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
      >
        <EyeOff className="w-4 h-4 text-gray-400" />
        Hide Column
      </button>
      {tasksCount > 0 && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
          <button
            onClick={() => {
              onClearColumn();
              onClose();
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Column ({tasksCount})
          </button>
        </>
      )}
    </div>
  );
};

// ============================================
// KANBAN COLUMN
// ============================================

interface KanbanColumnProps {
  status: TaskStatus;
  name: string;
  color: string;
  tasks: Task[];
  allTasks: Task[];
  onTaskMove: (
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    toIndex: number,
    subtaskIds?: string[]
  ) => Promise<void>;
  onAddTask: (status: TaskStatus) => void;
  onHideColumn: (status: TaskStatus) => void;
  onClearColumn: (status: TaskStatus) => void;
  isUpdating: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  name,
  color,
  tasks,
  allTasks,
  onTaskMove,
  onAddTask,
  onHideColumn,
  onClearColumn,
  isUpdating,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TASK,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  const handleDrop = async (item: DragItem) => {
    const fromStatus = item.fromColumn;
    const toStatus = item.status;
    let toIndex = item.index;

    console.log('🎯 DROP:', {
      taskId: item.id,
      fromStatus,
      toStatus,
      toIndex,
      hasSubtasks: item.hasSubtasks,
      isSubtask: !!item.parentTaskId,
    });

    // If it's a subtask, we need to adjust the position to be near its parent
    if (item.parentTaskId && toStatus === fromStatus) {
      // Find parent task in the target column
      const parentTask = tasks.find((t) => t.id === item.parentTaskId);
      if (parentTask) {
        const parentIndex = tasks.findIndex((t) => t.id === item.parentTaskId);
        const parentSubtasks = tasks.filter(
          (t) => t.parentTaskId === item.parentTaskId && t.id !== item.id
        );

        // Subtask should be positioned right after parent (but can be reordered among siblings)
        const minIndex = parentIndex + 1;
        const maxIndex = parentIndex + parentSubtasks.length + 1;
        toIndex = Math.max(minIndex, Math.min(toIndex, maxIndex));
      }
    }

    // Check if there's any actual change
    const originalTask = allTasks.find((t) => t.id === item.id);
    if (originalTask) {
      const sameColumn = fromStatus === toStatus;
      const samePosition = originalTask.position === toIndex;

      if (sameColumn && samePosition) {
        console.log('⏭️  No change detected, skipping');
        return;
      }
    }

    await onTaskMove(item.id, fromStatus, toStatus, toIndex, item.subtaskIds);
  };

  const handleSortByPriority = async () => {
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
      none: 4,
    };
    const sorted = [...tasks].sort(
      (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    );
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i) {
        await onTaskMove(sorted[i].id, status, status, i);
      }
    }
  };

  const handleSortByDueDate = async () => {
    const sorted = [...tasks].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i) {
        await onTaskMove(sorted[i].id, status, status, i);
      }
    }
  };

  drop(columnRef);

  // Build task hierarchy for display
  const taskHierarchy = useMemo(() => {
    const result: Array<{ task: Task; isSubtask: boolean }> = [];

    tasks.forEach((task) => {
      if (!task.parentTaskId) {
        // Add parent task
        result.push({ task, isSubtask: false });

        // Add its subtasks immediately after
        const subtasks = tasks.filter((t) => t.parentTaskId === task.id);
        subtasks.forEach((subtask) => {
          result.push({ task: subtask, isSubtask: true });
        });
      }
    });

    return result;
  }, [tasks]);

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{name}</h3>
          <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300">
            {tasks.length}
          </span>
          {isUpdating && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500 dark:text-brand-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onAddTask(status)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-150 hover:scale-105 active:scale-95"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-150 hover:scale-105 active:scale-95"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <ColumnMenu
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              status={status}
              tasksCount={tasks.length}
              onClearColumn={() => onClearColumn(status)}
              onHideColumn={() => onHideColumn(status)}
              onSortByPriority={handleSortByPriority}
              onSortByDueDate={handleSortByDueDate}
            />
          </div>
        </div>
      </div>

      {/* Column Body */}
      <div
        ref={columnRef}
        className={`flex-1 p-3 overflow-y-auto kanban-scrollbar transition-all duration-200 ${
          isActive ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''
        }`}
        style={{
          maxHeight: 'calc(100vh - 280px)',
          minHeight: '200px',
        }}
      >
        {tasks.length === 0 ? (
          <DropZone
            status={status}
            index={0}
            onDrop={handleDrop}
            isEmptyColumn={true}
            onAddTask={() => onAddTask(status)}
          />
        ) : (
          <div>
            {/* Drop zone at top */}
            <DropZone status={status} index={0} onDrop={handleDrop} />

            {/* Tasks with drop zones - using hierarchy */}
            {taskHierarchy.map(({ task, isSubtask }, hierarchyIndex) => {
              const actualIndex = tasks.findIndex((t) => t.id === task.id);
              return (
                <React.Fragment key={task.id}>
                  <DraggableTaskCard
                    task={task}
                    index={actualIndex}
                    status={status}
                    allTasks={allTasks}
                    isSubtask={isSubtask}
                  />
                  <DropZone status={status} index={actualIndex + 1} onDrop={handleDrop} />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN KANBAN BOARD
// ============================================

interface KanbanBoardProps {
  tasks: Task[];
  columns?: TaskStatus[];
}

export const KanbanBoardContent: React.FC<KanbanBoardProps> = ({
  tasks,
  columns = ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
}) => {
  const { filters, setIsCreateTaskModalOpen, setCreateTaskInitialStatus, refetchTasks } =
    useProjectContext();
  const updatePositionMutation = useUpdateTaskPositionAndStatus();
  const deleteTaskMutation = useDeleteTask();

  const [hiddenColumns, setHiddenColumns] = useState<Set<TaskStatus>>(new Set());
  const [showClearColumnModal, setShowClearColumnModal] = useState(false);
  const [columnToClear, setColumnToClear] = useState<{
    status: TaskStatus;
    count: number;
  } | null>(null);

  const [updatingColumns, setUpdatingColumns] = useState<Set<TaskStatus>>(new Set());

  const tasksByColumn = useMemo(() => {
    const filteredTasks = tasks.filter((task) => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()))
        return false;
      if (
        filters.assigneeIds.length > 0 &&
        (!task.assigneeIds ||
          !task.assigneeIds.some((id) => filters.assigneeIds.includes(id as any)))
      )
        return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority))
        return false;
      if (filters.types.length > 0 && !filters.types.includes(task.type!)) return false;
      if (
        filters.labelIds.length > 0 &&
        (!task.labelIds || !task.labelIds.some((l) => filters.labelIds.includes(l as any)))
      )
        return false;
      return true;
    });

    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      cancelled: [],
    };

    // Group tasks by status
    filteredTasks.forEach((task) => {
      grouped[task.status]?.push(task);
    });

    // Sort each column by position
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => a.position - b.position);
    });

    return grouped;
  }, [tasks, filters]);

  const visibleColumns = STATUS_COLUMNS.filter(
    (col) => columns.includes(col.id) && !hiddenColumns.has(col.id)
  );

  const handleTaskMove = useCallback(
    async (
      taskId: string,
      fromStatus: TaskStatus,
      toStatus: TaskStatus,
      toIndex: number,
      subtaskIds?: string[]
    ) => {
      console.log('🚀 handleTaskMove:', { taskId, fromStatus, toStatus, toIndex, subtaskIds });

      setUpdatingColumns((prev) => new Set([...prev, toStatus, fromStatus]));

      try {
        // Move the main task
        await updatePositionMutation.mutateAsync({
          id: taskId,
          status: toStatus,
          position: toIndex,
        });

        // If moving to a different column and task has subtasks, move them too
        if (fromStatus !== toStatus && subtaskIds && subtaskIds.length > 0) {
          console.log('📦 Moving subtasks:', subtaskIds);

          // Move each subtask right after the parent
          for (let i = 0; i < subtaskIds.length; i++) {
            await updatePositionMutation.mutateAsync({
              id: subtaskIds[i],
              status: toStatus,
              position: toIndex + i + 1,
            });
          }
        }

        const statusName = STATUS_COLUMNS.find((c) => c.id === toStatus)?.name;
        toast.success(`Moved to ${statusName}`, { duration: 2000 });

        await refetchTasks();
      } catch (error) {
        console.error('❌ Move failed:', error);
        toast.error(getErrorMessage(error));
        await refetchTasks();
      } finally {
        setUpdatingColumns((prev) => {
          const next = new Set(prev);
          next.delete(toStatus);
          next.delete(fromStatus);
          return next;
        });
      }
    },
    [updatePositionMutation, refetchTasks]
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
      const columnTasks = tasksByColumn[status];
      setColumnToClear({ status, count: columnTasks.length });
      setShowClearColumnModal(true);
    },
    [tasksByColumn]
  );

  const confirmClearColumn = async () => {
    if (!columnToClear) return;

    const columnTasks = tasksByColumn[columnToClear.status];
    try {
      await Promise.all(columnTasks.map((task) => deleteTaskMutation.mutateAsync(task.id)));
      setShowClearColumnModal(false);
      setColumnToClear(null);
      toast.success(`Cleared ${columnToClear.count} task${columnToClear.count !== 1 ? 's' : ''}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleShowAllColumns = useCallback(() => {
    setHiddenColumns(new Set());
  }, []);

  return (
    <div className="flex flex-col h-full">
      {hiddenColumns.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg animate-in slide-in-from-top duration-300">
          <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
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

      <div className="flex gap-4 overflow-x-auto pb-4 kanban-scrollbar">
        {visibleColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            status={column.id}
            name={column.name}
            color={column.color}
            tasks={tasksByColumn[column.id]}
            allTasks={tasks}
            onTaskMove={handleTaskMove}
            onAddTask={handleAddTask}
            onHideColumn={handleHideColumn}
            onClearColumn={handleClearColumn}
            isUpdating={updatingColumns.has(column.id)}
          />
        ))}
      </div>

      <ConfirmModal
        isOpen={showClearColumnModal}
        onConfirm={confirmClearColumn}
        onCancel={() => {
          setShowClearColumnModal(false);
          setColumnToClear(null);
        }}
        title="Clear Column"
        message={`Are you sure you want to delete ${
          columnToClear?.count || 0
        } task${columnToClear?.count !== 1 ? 's' : ''} from this column? This action cannot be undone.`}
        confirmText="Clear Column"
        variant="danger"
      />
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
