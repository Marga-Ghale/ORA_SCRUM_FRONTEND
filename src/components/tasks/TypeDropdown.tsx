import { useEffect, useRef, useState } from 'react';
import { TaskType, TASK_TYPE_CONFIG } from '../../types/project';
import { Bug, Sparkles, Target, CheckCircle2 } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
  task: CheckCircle2,
  bug: Bug,
  story: Sparkles,
  epic: Target,
};

export const TypeDropdown: React.FC<{
  value: TaskType;
  onChange: (value: TaskType) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const key = String(value);
  const Icon = TYPE_ICONS[key] ?? CheckCircle2;
  const config = TASK_TYPE_CONFIG[value];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!config) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 flex items-center gap-2"
      >
        <Icon className="w-4 h-4" style={{ color: config.color }} />
        {config.name}
      </button>

      {isOpen && (
        <div className="absolute mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border z-50 min-w-[160px]">
          {Object.entries(TASK_TYPE_CONFIG).map(([k, cfg]) => {
            const ItemIcon = TYPE_ICONS[k] ?? CheckCircle2;

            return (
              <button
                key={k}
                onClick={() => {
                  onChange(k as TaskType);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ItemIcon className="w-4 h-4" style={{ color: cfg.color }} />
                <span className="font-semibold">{cfg.name}</span>
                {value === k && <CheckCircle2 className="w-4 h-4 text-brand-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
