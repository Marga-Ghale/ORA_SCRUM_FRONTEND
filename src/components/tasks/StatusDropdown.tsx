import React, { useEffect, useRef, useState } from 'react';
import { STATUS_COLUMNS, TaskStatus } from '../../types/project';
import { AlertCircle, Zap, CheckCircle2, Circle } from 'lucide-react';

const STATUS_ICONS: Record<string, React.ElementType> = {
  todo: Circle,
  'in-progress': Zap,
  review: AlertCircle,
  done: CheckCircle2,
};

export const StatusDropdown: React.FC<{
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentStatus = STATUS_COLUMNS.find((s) => s.id === value);
  const Icon = STATUS_ICONS[String(value)] ?? Circle;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!currentStatus) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 shadow-sm flex items-center gap-2"
        style={{
          backgroundColor: `${currentStatus.color}15`,
          borderColor: `${currentStatus.color}30`,
          color: currentStatus.color,
        }}
      >
        <Icon className="w-4 h-4" />
        {currentStatus.name}
      </button>

      {isOpen && (
        <div className="absolute mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border z-50 min-w-[200px]">
          {STATUS_COLUMNS.map((status) => {
            const ItemIcon = STATUS_ICONS[status.id] ?? Circle;

            return (
              <button
                key={status.id}
                onClick={() => {
                  onChange(status.id as TaskStatus);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${status.color}20` }}
                >
                  <ItemIcon className="w-4 h-4" style={{ color: status.color }} />
                </div>
                <span className="font-semibold">{status.name}</span>
                {value === status.id && <CheckCircle2 className="w-4 h-4 text-brand-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
