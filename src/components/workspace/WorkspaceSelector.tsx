// src/components/WorkspaceSelector.tsx
import React, { useState } from 'react';
import { ChevronDown, Plus, Check, Building2 } from 'lucide-react';
import { useMyWorkspaces } from '../../hooks/api/useWorkspaces';

interface WorkspaceSelectorProps {
  currentWorkspace: any;
  onWorkspaceChange: (workspace: any) => void;
  onCreateNew: () => void;
  showFull: boolean;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspace,
  onWorkspaceChange,
  onCreateNew,
  showFull,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: workspaces, isLoading } = useMyWorkspaces();

  const handleSelect = (workspace: any) => {
    onWorkspaceChange(workspace);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-2 border-b border-[#2a2e33]">
        <div className="w-full flex items-center gap-2.5 p-2 rounded-md animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-[#2a2e33]" />
          {showFull && <div className="flex-1 h-4 bg-[#2a2e33] rounded" />}
        </div>
      </div>
    );
  }

  // If no workspaces, show create prompt
  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="p-2 border-b border-[#2a2e33]">
        <button
          onClick={onCreateNew}
          className={`w-full flex items-center gap-2.5 p-2 rounded-md bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 transition-colors ${!showFull ? 'justify-center' : ''}`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center text-[#a78bfa] flex-shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          {showFull && (
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#a78bfa]">Create Workspace</p>
              <p className="text-xs text-[#6b7280]">Get started</p>
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 border-b border-[#2a2e33] relative">
      <button
        onClick={() => showFull && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-[#2a2e33] transition-colors ${!showFull ? 'justify-center' : ''}`}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          style={{
            background: currentWorkspace?.color
              ? currentWorkspace.color
              : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          }}
        >
          {currentWorkspace?.icon || currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
        </div>
        {showFull && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </p>
              <p className="text-xs text-[#6b7280]">
                {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#6b7280] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && showFull && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-2 right-2 mt-1 bg-[#25282c] border border-[#2a2e33] rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto">
            <div className="p-1.5">
              {/* Current Workspaces */}
              <div className="mb-1">
                <p className="px-2 py-1 text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                  Your Workspaces
                </p>
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleSelect(workspace)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-md transition-colors
                      ${
                        currentWorkspace?.id === workspace.id
                          ? 'bg-[#7c3aed]/20 text-white'
                          : 'text-[#9ca3af] hover:bg-[#2a2e33] hover:text-white'
                      }`}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{
                        background:
                          workspace.color || 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                      }}
                    >
                      {workspace.icon || workspace.name[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-left text-sm truncate">{workspace.name}</span>
                    {currentWorkspace?.id === workspace.id && (
                      <Check className="w-4 h-4 text-[#7c3aed]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Create New */}
              <div className="border-t border-[#2a2e33] pt-1.5 mt-1.5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onCreateNew();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-md text-[#9ca3af] hover:bg-[#2a2e33] hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-[#7c3aed]/20 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-[#a78bfa]" />
                  </div>
                  <span className="text-sm">Create New Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSelector;
