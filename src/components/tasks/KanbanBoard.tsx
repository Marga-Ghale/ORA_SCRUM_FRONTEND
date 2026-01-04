// src/components/tasks/KanbanBoard.tsx - FINAL PRODUCTION VERSION
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskStatus, STATUS_COLUMNS } from '../../types/project';
import TaskCard from './TaskCard';
import { MoreVertical, Plus, TrendingUp, Calendar, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../modals/ConfirmModal';
import { useDeleteTask, useUpdateTask } from '../../hooks/api/useTasks';

const getErrorMessage = (error: any): string => {
  return error?.message || 'An unexpected error occurred';
};

const ItemTypes = {
  TASK: 'task',
};

interface DragItem {
  id: string;
  status: TaskStatus;
  index: number;
  fromColumn: TaskStatus;
  type: string;
}

interface TaskWithLocalPosition extends Task {
  localPosition: number;
}

interface DraggableTaskCardProps {
  task: TaskWithLocalPosition;
  index: number;
  status: TaskStatus;
  onHover: (
    dragIndex: number,
    hoverIndex: number,
    dragStatus: TaskStatus,
    hoverStatus: TaskStatus
  ) => void;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, index, status, onHover }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: (): DragItem => {
      return {
        id: task.id,
        status,
        index,
        fromColumn: status,
        type: ItemTypes.TASK,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TASK,
    hover(item: DragItem, monitor) {
      if (!ref.current) return;
      if (item.id === task.id) return;

      const dragIndex = item.index;
      const hoverIndex = index;
      const dragStatus = item.status;
      const hoverStatus = status;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragStatus === hoverStatus) {
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      }

      onHover(dragIndex, hoverIndex, dragStatus, hoverStatus);
      item.index = hoverIndex;
      item.status = hoverStatus;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-200 ease-out mb-2.5
        ${isDragging ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div
        className={`
          transition-all duration-150
          ${isDragging ? 'scale-105 rotate-1 cursor-grabbing' : 'scale-100 rotate-0 cursor-grab'}
          ${isOver && !isDragging ? 'scale-[1.02]' : ''}
        `}
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
      className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <button
        onClick={() => {
          onSortByPriority();
          onClose();
        }}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
        Sort by Priority
      </button>
      <button
        onClick={() => {
          onSortByDueDate();
          onClose();
        }}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
        Sort by Due Date
      </button>
      <div className="border-t border-gray-100 dark:border-gray-700 my-1.5" />
      <button
        onClick={() => {
          onHideColumn();
          onClose();
        }}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 transition-colors"
      >
        <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
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
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 sm:gap-3 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
  tasks: TaskWithLocalPosition[];
  onTaskMove: (
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    toIndex: number
  ) => Promise<void>;
  onAddTask: (status: TaskStatus) => void;
  onHideColumn: (status: TaskStatus) => void;
  onClearColumn: (status: TaskStatus) => void;
  onHover: (
    dragIndex: number,
    hoverIndex: number,
    dragStatus: TaskStatus,
    hoverStatus: TaskStatus
  ) => void;
  isUpdating: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  name,
  color,
  tasks,
  onTaskMove,
  onAddTask,
  onHideColumn,
  onClearColumn,
  onHover,
  isUpdating,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<TaskWithLocalPosition[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      const fromStatus = item.fromColumn;
      const toStatus = status;
      const dropIndex = item.index;

      // ✅ CRITICAL FIX: Always call onTaskMove with correct parameters
      console.log(`🎯 DROP: ${item.id} from ${fromStatus} to ${toStatus} at index ${dropIndex}`);
      onTaskMove(item.id, fromStatus, toStatus, dropIndex);
    },
    hover: (item: DragItem) => {
      if (item.status !== status && localTasks.length === 0) {
        item.status = status;
        item.index = 0;
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
    const sorted = [...localTasks].sort(
      (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    );

    sorted.forEach((task, index) => {
      onTaskMove(task.id, status, status, index);
    });
  };

  const handleSortByDueDate = () => {
    const sorted = [...localTasks].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    sorted.forEach((task, index) => {
      onTaskMove(task.id, status, status, index);
    });
  };

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px] lg:min-w-[340px] lg:max-w-[340px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{name}</h3>
          <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0">
            {localTasks.length}
          </span>
          {isUpdating && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 dark:text-blue-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onAddTask(status)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all hover:scale-110"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all hover:scale-110"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <ColumnMenu
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              status={status}
              tasksCount={localTasks.length}
              onClearColumn={() => onClearColumn(status)}
              onHideColumn={() => onHideColumn(status)}
              onSortByPriority={handleSortByPriority}
              onSortByDueDate={handleSortByDueDate}
            />
          </div>
        </div>
      </div>

      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className={`
          flex-1 p-3 overflow-y-auto custom-scrollbar transition-all duration-200
          ${isActive ? 'bg-brand-50/40 dark:bg-brand-950/30 ring-2 ring-brand-400/60 ring-inset' : ''}
        `}
        style={{
          maxHeight: 'calc(100vh - 280px)',
          minHeight: '200px',
        }}
      >
        {localTasks.length === 0 ? (
          <div
            className={`
              flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl
              transition-all duration-200 cursor-pointer group
              ${
                isActive
                  ? 'border-brand-400 bg-brand-50/60 dark:bg-brand-950/40 scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }
            `}
            onClick={() => onAddTask(status)}
          >
            <Plus
              className={`w-6 h-6 mb-2 transition-all ${
                isActive
                  ? 'text-brand-500 scale-125 animate-pulse'
                  : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-500 group-hover:scale-110'
              }`}
            />
            <span
              className={`text-sm font-medium transition-all ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400'
              }`}
            >
              {isActive ? 'Drop here' : 'Add task'}
            </span>
          </div>
        ) : (
          <>
            {isActive && (
              <div className="h-1 mb-2 bg-brand-400/60 dark:bg-brand-500/60 rounded-full animate-pulse" />
            )}

            <div className="space-y-0">
              {localTasks.map((task, index) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  status={status}
                  onHover={onHover}
                />
              ))}
            </div>

            {isActive && (
              <div className="h-1 mt-2 bg-brand-400/60 dark:bg-brand-500/60 rounded-full animate-pulse" />
            )}
          </>
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
  const { filters, setIsCreateTaskModalOpen, setCreateTaskInitialStatus, refetchTasks } =
    useProjectContext();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [hiddenColumns, setHiddenColumns] = useState<Set<TaskStatus>>(new Set());
  const [showClearColumnModal, setShowClearColumnModal] = useState(false);
  const [columnToClear, setColumnToClear] = useState<{ status: TaskStatus; count: number } | null>(
    null
  );

  // ✅ LOCAL POSITION STATE - Frontend only, never sent to backend
  const [localPositions, setLocalPositions] = useState<
    Record<string, { status: TaskStatus; position: number }>
  >({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // ✅ Initialize local positions from tasks
  useEffect(() => {
    const positions: Record<string, { status: TaskStatus; position: number }> = {};
    tasks.forEach((task, index) => {
      if (!localPositions[task.id]) {
        positions[task.id] = {
          status: task.status,
          position: index,
        };
      }
    });
    if (Object.keys(positions).length > 0) {
      setLocalPositions((prev) => ({ ...prev, ...positions }));
    }
  }, [tasks.map((t) => t.id).join(',')]);

  // ✅ Build tasksByColumn with local positions + subtasks follow parent
  const tasksByColumn = useMemo(() => {
    const filteredTasks = tasks.filter((task) => {
      // Apply filters
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

    // ✅ Separate parent tasks and subtasks
    const parentTasks = filteredTasks.filter((t) => !t.parentTaskId);
    const subtasksMap = new Map<string, Task[]>();

    filteredTasks
      .filter((t) => t.parentTaskId)
      .forEach((subtask) => {
        if (!subtasksMap.has(subtask.parentTaskId!)) {
          subtasksMap.set(subtask.parentTaskId!, []);
        }
        subtasksMap.get(subtask.parentTaskId!)!.push(subtask);
      });

    const grouped: Record<TaskStatus, TaskWithLocalPosition[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      cancelled: [],
    };

    // ✅ Group parent tasks by their LOCAL position status
    parentTasks.forEach((task) => {
      const localPos = localPositions[task.id];
      const effectiveStatus = localPos?.status ?? task.status;
      const localPosition = localPos?.position ?? 0;

      if (grouped[effectiveStatus]) {
        grouped[effectiveStatus].push({ ...task, localPosition });

        // ✅ Add subtasks right after parent with same status
        const taskSubtasks = subtasksMap.get(task.id) || [];
        taskSubtasks.forEach((subtask, subIndex) => {
          grouped[effectiveStatus].push({
            ...subtask,
            localPosition: localPosition + 0.1 + subIndex * 0.01,
          });
        });
      }
    });

    // ✅ Sort by local position
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => a.localPosition - b.localPosition);
    });

    return grouped;
  }, [tasks, filters, localPositions]);

  const visibleColumns = STATUS_COLUMNS.filter(
    (col) => columns.includes(col.id) && !hiddenColumns.has(col.id)
  );

  // ✅ Handle hover during drag (instant UI update for position preview)
  const handleHover = useCallback(
    (dragIndex: number, hoverIndex: number, dragStatus: TaskStatus, hoverStatus: TaskStatus) => {
      setLocalPositions((prev) => {
        const newPositions = { ...prev };
        const draggedTask = tasksByColumn[dragStatus][dragIndex];

        if (!draggedTask) return prev;

        const draggedTaskId = draggedTask.id;

        if (dragStatus === hoverStatus) {
          // ✅ Reorder within same column - just local position update
          const columnTasks = [...tasksByColumn[dragStatus]];
          const positions = columnTasks.map((t, i) => {
            if (t.id === draggedTaskId) return hoverIndex;
            if (i >= Math.min(dragIndex, hoverIndex) && i <= Math.max(dragIndex, hoverIndex)) {
              return dragIndex > hoverIndex ? i + 1 : i - 1;
            }
            return i;
          });

          columnTasks.forEach((task, i) => {
            newPositions[task.id] = { status: dragStatus, position: positions[i] };
          });
        } else {
          // ✅ Move to different column - update status in local state
          newPositions[draggedTaskId] = { status: hoverStatus, position: hoverIndex };

          // Update positions in target column
          tasksByColumn[hoverStatus].forEach((task, i) => {
            if (i >= hoverIndex) {
              newPositions[task.id] = { status: hoverStatus, position: i + 1 };
            }
          });

          // ✅ Move subtasks with parent
          if (!draggedTask.parentTaskId) {
            const subtasks = tasks.filter((t) => t.parentTaskId === draggedTaskId);
            subtasks.forEach((subtask, subIndex) => {
              newPositions[subtask.id] = {
                status: hoverStatus,
                position: hoverIndex + 0.1 + subIndex * 0.01,
              };
            });
          }
        }

        return newPositions;
      });
    },
    [tasksByColumn, tasks]
  );

  // ✅ Handle task drop - ALWAYS call API if status changed
  const handleTaskMove = useCallback(
    async (taskId: string, fromStatus: TaskStatus, toStatus: TaskStatus, toIndex: number) => {
      console.log(`🚀 handleTaskMove called: ${taskId} from ${fromStatus} to ${toStatus}`);

      setIsUpdating(true);
      setUpdatingTaskId(taskId);

      try {
        // ✅ Update local position immediately for instant feedback
        setLocalPositions((prev) => ({
          ...prev,
          [taskId]: { status: toStatus, position: toIndex },
        }));

        // ✅ CRITICAL: ALWAYS call API if status changed (different column)
        if (fromStatus !== toStatus) {
          console.log(
            `✅ API CALL: Updating task ${taskId} status from ${fromStatus} to ${toStatus}`
          );

          await updateTaskMutation.mutateAsync({
            id: taskId,
            data: { status: toStatus },
          });

          // ✅ Move subtasks with parent task
          const task = tasks.find((t) => t.id === taskId);
          if (task && !task.parentTaskId) {
            const subtasks = tasks.filter((t) => t.parentTaskId === taskId);
            console.log(`🔗 Moving ${subtasks.length} subtasks with parent`);

            for (const subtask of subtasks) {
              await updateTaskMutation.mutateAsync({
                id: subtask.id,
                data: { status: toStatus },
              });

              setLocalPositions((prev) => ({
                ...prev,
                [subtask.id]: { status: toStatus, position: toIndex + 0.1 },
              }));
            }
          }

          toast.success(`Task moved to ${STATUS_COLUMNS.find((c) => c.id === toStatus)?.name}`, {
            duration: 2000,
            icon: '✅',
          });

          // ✅ Refresh tasks to get updated data
          await refetchTasks();
        } else {
          // ✅ Same column - only local position update, no API call
          console.log(`📍 Local position update only: ${taskId} at index ${toIndex}`);
        }
      } catch (error) {
        console.error('❌ Error moving task:', error);
        toast.error(getErrorMessage(error), { duration: 3000 });

        // ✅ Rollback local position on error
        setLocalPositions((prev) => ({
          ...prev,
          [taskId]: { status: fromStatus, position: toIndex },
        }));
      } finally {
        setIsUpdating(false);
        setUpdatingTaskId(null);
      }
    },
    [updateTaskMutation, tasks, refetchTasks]
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
        <div className="flex items-center gap-3 mb-4 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl animate-in fade-in slide-in-from-top duration-200">
          <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {hiddenColumns.size} column{hiddenColumns.size !== 1 ? 's' : ''} hidden
          </span>
          <button
            onClick={handleShowAllColumns}
            className="ml-auto text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex-shrink-0"
          >
            Show All
          </button>
        </div>
      )}

      {isUpdating && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl animate-in fade-in slide-in-from-top duration-200">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Updating task status...
          </span>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
        {visibleColumns.map((column) => (
          <div key={column.id} className="snap-start">
            <KanbanColumn
              status={column.id}
              name={column.name}
              color={column.color}
              tasks={tasksByColumn[column.id]}
              onTaskMove={handleTaskMove}
              onAddTask={handleAddTask}
              onHideColumn={handleHideColumn}
              onClearColumn={handleClearColumn}
              onHover={handleHover}
              isUpdating={
                isUpdating && tasksByColumn[column.id].some((t) => t.id === updatingTaskId)
              }
            />
          </div>
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
        message={`Are you sure you want to delete ${columnToClear?.count || 0} task${columnToClear?.count !== 1 ? 's' : ''} from this column? This action cannot be undone.`}
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
