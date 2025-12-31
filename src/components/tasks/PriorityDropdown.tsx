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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const key = String(value);
  const Icon = PRIORITY_ICONS[key] ?? Flag;
  const config = PRIORITY_CONFIG[value];

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!config) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 flex items-center gap-2 whitespace-nowrap border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <Icon className="w-4 h-4" style={{ color: PRIORITY_COLORS[key] }} />
        {config.name}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] z-[9999]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => {
            const ItemIcon = PRIORITY_ICONS[k] ?? Flag;

            return (
              <button
                key={k}
                onClick={() => {
                  onChange(k as Priority);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl transition-colors"
              >
                <ItemIcon className="w-4 h-4" style={{ color: PRIORITY_COLORS[k] }} />
                <span className="font-semibold">{cfg.name}</span>
                {value === k && <CheckCircle2 className="w-4 h-4 text-brand-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
