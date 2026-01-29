import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Target, Check, X } from 'lucide-react';
import { useSprintsByProject } from '../../hooks/api/useSprints';

interface SprintSelectorProps {
  projectId: string;
  selectedSprintId?: string | null;
  onSelect: (sprintId: string | null) => void;
  size?: 'sm' | 'md';
  showClear?: boolean;
}

export const SprintSelector: React.FC<SprintSelectorProps> = ({
  projectId,
  selectedSprintId,
  onSelect,
  size = 'md',
  showClear = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: sprints = [] } = useSprintsByProject(projectId, { enabled: !!projectId });

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'planning':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${sizeClasses} rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full justify-between`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Target
            className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`}
          />
          <span
            className={`truncate ${selectedSprint ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
          >
            {selectedSprint ? selectedSprint.name : 'No Sprint'}
          </span>
        </div>
        <ChevronDown
          className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl py-1 max-h-60 overflow-y-auto">
          {showClear && selectedSprintId && (
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Remove from sprint
            </button>
          )}

          {sprints.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No sprints available</div>
          ) : (
            sprints.map((sprint) => (
              <button
                key={sprint.id}
                onClick={() => {
                  onSelect(sprint.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {sprint.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(sprint.status)}`}
                  >
                    {sprint.status}
                  </span>
                </div>
                {sprint.id === selectedSprintId && (
                  <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
