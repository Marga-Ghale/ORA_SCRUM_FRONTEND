import { useEffect, useRef, useState } from 'react';
import { Priority, PRIORITY_CONFIG } from '../../types/project';
import { Flag, Zap, CheckCircle2 } from 'lucide-react';

const PRIORITY_ICONS: Record<string, React.ElementType> = {
  low: Flag,
  medium: Flag,
  high: Flag,
  urgent: Zap,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#dc2626',
};

export const PriorityDropdown: React.FC<{
  value: Priority;
  onChange: (value: Priority) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const key = String(value);
  const Icon = PRIORITY_ICONS[key] ?? Flag;
  const config = PRIORITY_CONFIG[value];

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
        <Icon className="w-4 h-4" style={{ color: PRIORITY_COLORS[key] }} />
        {config.name}
      </button>

      {isOpen && (
        <div className="absolute mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border z-50 min-w-[180px]">
          {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => {
            const ItemIcon = PRIORITY_ICONS[k] ?? Flag;

            return (
              <button
                key={k}
                onClick={() => {
                  onChange(k as Priority);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ItemIcon className="w-4 h-4" style={{ color: PRIORITY_COLORS[k] }} />
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
