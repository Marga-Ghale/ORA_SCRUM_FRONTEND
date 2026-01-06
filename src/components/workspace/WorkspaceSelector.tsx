// src/components/WorkspaceSelector.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useMyWorkspaces } from '../../hooks/api/useWorkspaces';
import CreateWorkSpaceModal from '../modals/CreateWorkSpaceModal';

interface WorkspaceSelectorProps {
  currentWorkspace: any;
  onWorkspaceChange: (workspace: any) => void;
  showFull: boolean;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspace,
  onWorkspaceChange,
  showFull,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: workspaces, isLoading, refetch } = useMyWorkspaces();

  // Refetch workspaces when component mounts or when modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      refetch();
    }
  }, [isCreateModalOpen, refetch]);

  const handleSelect = (workspace: any) => {
    onWorkspaceChange(workspace);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleWorkspaceCreated = (newWorkspace: any) => {
    // Refetch to get updated list
    refetch();
    // Automatically select the newly created workspace
    onWorkspaceChange(newWorkspace);
  };

  if (isLoading) {
    return (
      <div className="p-3 border-b border-gray-200 dark:border-[#2a2e33]">
        <div className="w-full flex items-center gap-3 p-2.5 rounded-xl animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-[#2a2e33]" />
          {showFull && <div className="flex-1 h-5 bg-gray-200 dark:bg-[#2a2e33] rounded-lg" />}
        </div>
      </div>
    );
  }

  // If no workspaces, show create prompt
  if (!workspaces || workspaces.length === 0) {
    return (
      <>
        <div className="p-3 border-b border-gray-200 dark:border-[#2a2e33]">
          <button
            onClick={handleCreateNew}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl 
              bg-violet-100 dark:bg-[#7c3aed]/10 
              hover:bg-violet-200 dark:hover:bg-[#7c3aed]/20 
              transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]
              ${!showFull ? 'justify-center' : ''}`}
          >
            <div
              className="w-9 h-9 rounded-xl 
              bg-violet-200 dark:bg-[#7c3aed]/20 
              flex items-center justify-center 
              text-violet-600 dark:text-[#a78bfa] 
              flex-shrink-0 shadow-sm
              group-hover:scale-110 transition-transform duration-200"
            >
              <Plus className="w-5 h-5" />
            </div>
            {showFull && (
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-violet-700 dark:text-[#a78bfa]">
                  Create Workspace
                </p>
                <p className="text-xs text-gray-600 dark:text-[#6b7280]">Get started</p>
              </div>
            )}
          </button>
        </div>

        <CreateWorkSpaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleWorkspaceCreated}
        />
      </>
    );
  }

  return (
    <>
      <div className="p-3 border-b border-gray-200 dark:border-[#2a2e33] relative">
        <button
          onClick={() => showFull && setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl 
            hover:bg-gray-100 dark:hover:bg-[#2a2e33] 
            transition-all duration-200 group
            active:scale-[0.98]
            ${!showFull ? 'justify-center' : ''}`}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0
              shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200
              ring-2 ring-white dark:ring-[#1a1d21] ring-offset-1 ring-offset-gray-100 dark:ring-offset-[#1a1d21]"
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                  {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 dark:text-[#6b7280] transition-transform duration-300 
                  ${isOpen ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && showFull && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute top-full left-3 right-3 mt-2 
              bg-white dark:bg-[#25282c] 
              border border-gray-200 dark:border-[#2a2e33] 
              rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto
              animate-in slide-in-from-top-2 duration-200"
            >
              <div className="p-2">
                {/* Current Workspaces */}
                <div className="mb-2">
                  <p className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider">
                    Your Workspaces
                  </p>
                  <div className="space-y-1">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => handleSelect(workspace)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl 
                          transition-all duration-200 group/item
                          active:scale-[0.98]
                          ${
                            currentWorkspace?.id === workspace.id
                              ? 'bg-violet-100 dark:bg-[#7c3aed]/20 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-700 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#2a2e33] hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0
                            shadow-sm group-hover/item:shadow-md group-hover/item:scale-105 transition-all duration-200"
                          style={{
                            background:
                              workspace.color ||
                              'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                          }}
                        >
                          {workspace.icon || workspace.name[0].toUpperCase()}
                        </div>
                        <span className="flex-1 text-left text-sm font-medium truncate">
                          {workspace.name}
                        </span>
                        {currentWorkspace?.id === workspace.id && (
                          <div
                            className="w-5 h-5 rounded-full bg-violet-600 dark:bg-[#7c3aed] 
                            flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create New */}
                <div className="border-t border-gray-200 dark:border-[#2a2e33] pt-2 mt-2">
                  <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl 
                      text-gray-700 dark:text-[#9ca3af] 
                      hover:bg-gray-100 dark:hover:bg-[#2a2e33] 
                      hover:text-gray-900 dark:hover:text-white 
                      transition-all duration-200 group/create
                      active:scale-[0.98]"
                  >
                    <div
                      className="w-8 h-8 rounded-lg 
                      bg-violet-100 dark:bg-[#7c3aed]/20 
                      flex items-center justify-center flex-shrink-0
                      group-hover/create:scale-110 transition-transform duration-200"
                    >
                      <Plus className="w-4 h-4 text-violet-600 dark:text-[#a78bfa]" />
                    </div>
                    <span className="text-sm font-medium">Create New Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkSpaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleWorkspaceCreated}
      />
    </>
  );
};

export default WorkspaceSelector;
