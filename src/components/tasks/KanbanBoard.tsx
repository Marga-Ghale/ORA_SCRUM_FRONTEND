import React from 'react';
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
  moveTask: (taskId: string, toStatus: TaskStatus, toIndex: number) => void;
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

interface KanbanColumnProps {
  status: TaskStatus;
  name: string;
  color: string;
  tasks: Task[];
  moveTask: (taskId: string, toStatus: TaskStatus, toIndex: number) => void;
  onAddTask?: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  name,
  color,
  tasks,
  moveTask,
  onAddTask,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: { id: string; status: TaskStatus; index: number }) => {
      if (item.status !== status) {
        moveTask(item.id, status, tasks.length);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px] bg-gray-50 dark:bg-gray-900 rounded-xl">
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {name}
          </h3>
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddTask}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Add task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="More options"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
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
        {tasks.length === 0 ? (
          <div className={`
            flex items-center justify-center h-24 border-2 border-dashed rounded-lg
            transition-colors duration-200
            ${isActive
              ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
              : 'border-gray-200 dark:border-gray-700'
            }
          `}>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Drop tasks here
            </span>
          </div>
        ) : (
          tasks.map((task, index) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              index={index}
              moveTask={moveTask}
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
  columns = ['todo', 'in_progress', 'in_review', 'done'],
}) => {
  const { filters, moveTask } = useProject(); // use moveTask from context

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.assignees.length > 0 && (!task.assignee || !filters.assignees.includes(task.assignee.id))) return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
    if (filters.types.length > 0 && !filters.types.includes(task.type)) return false;
    if (filters.labels.length > 0 && !task.labels.some(l => filters.labels.includes(l.id))) return false;
    return true;
  });

  const activeColumns = STATUS_COLUMNS.filter(col => columns.includes(col.id));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
      {activeColumns.map(column => {
        const columnTasks = filteredTasks
          .filter(task => task.status === column.id)
          .sort((a, b) => a.order - b.order);

        return (
          <KanbanColumn
            key={column.id}
            status={column.id}
            name={column.name}
            color={column.color}
            tasks={columnTasks}
            moveTask={moveTask} // pass moveTask from context
          />
        );
      })}
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
