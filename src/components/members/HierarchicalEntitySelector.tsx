// ✅ NEW FILE: src/components/members/HierarchicalEntitySelector.tsx

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  FolderOpen,
  Folder,
  FileText,
  Check,
} from 'lucide-react';
import { useAllAccessibleEntities } from '../../hooks/api/useAccessibleEntities';
import { EntityType } from '../../types/entity';

interface HierarchicalEntitySelectorProps {
  value: { type: EntityType; id: string } | null;
  onChange: (entity: { type: EntityType; id: string; name: string }) => void;
  disabled?: boolean;
}

const ENTITY_COLORS = {
  workspace: '#7c3aed',
  space: '#60a5fa',
  folder: '#fbbf24',
  project: '#ec4899',
};

export const HierarchicalEntitySelector: React.FC<HierarchicalEntitySelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { workspaces, spaces, folders, projects, isLoading } = useAllAccessibleEntities();

  // Auto-expand to show selected item
  useEffect(() => {
    if (!value) return;

    if (value.type === 'workspace') {
      // Workspace selected - no expansion needed
    } else if (value.type === 'space') {
      const space = spaces.find((s) => s.id === value.id);
      if (space) {
        setExpandedWorkspaces((prev) => new Set([...prev, space.workspaceId]));
      }
    } else if (value.type === 'folder') {
      const folder = folders.find((f) => f.id === value.id);
      if (folder) {
        const space = spaces.find((s) => s.id === folder.spaceId);
        if (space) {
          setExpandedWorkspaces((prev) => new Set([...prev, space.workspaceId]));
          setExpandedSpaces((prev) => new Set([...prev, space.id]));
        }
      }
    } else if (value.type === 'project') {
      const project = projects.find((p) => p.id === value.id);
      if (project) {
        const space = spaces.find((s) => s.id === project.spaceId);
        if (space) {
          setExpandedWorkspaces((prev) => new Set([...prev, space.workspaceId]));
          setExpandedSpaces((prev) => new Set([...prev, space.id]));
          if (project.folderId) {
            setExpandedFolders((prev) => new Set([...prev, project.folderId!]));
          }
        }
      }
    }
  }, [value, workspaces, spaces, folders, projects]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSpace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedEntity =
    value?.type === 'workspace'
      ? workspaces.find((w) => w.id === value.id)
      : value?.type === 'space'
        ? spaces.find((s) => s.id === value.id)
        : value?.type === 'folder'
          ? folders.find((f) => f.id === value.id)
          : value?.type === 'project'
            ? projects.find((p) => p.id === value.id)
            : null;

  const getSelectedIcon = () => {
    if (!value) return Building2;
    if (value.type === 'workspace') return Building2;
    if (value.type === 'space') return FolderOpen;
    if (value.type === 'folder') return Folder;
    return FileText;
  };

  const SelectedIcon = getSelectedIcon();

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left transition-all hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : selectedEntity ? (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${ENTITY_COLORS[value!.type]}20` }}
            >
              <SelectedIcon className="w-4 h-4" style={{ color: ENTITY_COLORS[value!.type] }} />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {value!.type}
              </span>
              <p className="text-xs text-gray-500 truncate">{selectedEntity.name}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Select where to add members</span>
        )}
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {workspaces.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No accessible entities found</p>
            </div>
          ) : (
            <div className="py-2">
              {workspaces.map((workspace) => {
                const workspaceSpaces = spaces.filter((s) => s.workspaceId === workspace.id);
                const isWorkspaceExpanded = expandedWorkspaces.has(workspace.id);
                const isWorkspaceSelected =
                  value?.type === 'workspace' && value.id === workspace.id;

                return (
                  <div key={workspace.id}>
                    {/* Workspace */}
                    <div className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <button
                        onClick={(e) => toggleWorkspace(workspace.id, e)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${isWorkspaceExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          onChange({ type: 'workspace', id: workspace.id, name: workspace.name });
                          setIsOpen(false);
                        }}
                        className="flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${ENTITY_COLORS.workspace}20` }}
                        >
                          <Building2
                            className="w-4 h-4"
                            style={{ color: ENTITY_COLORS.workspace }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 text-left">
                          {workspace.name}
                        </span>
                        {isWorkspaceSelected && (
                          <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        )}
                      </button>
                    </div>

                    {/* Spaces under workspace */}
                    {isWorkspaceExpanded &&
                      workspaceSpaces.map((space) => {
                        const spaceFolders = folders.filter((f) => f.spaceId === space.id);
                        const spaceProjects = projects.filter(
                          (p) => p.spaceId === space.id && !p.folderId
                        );
                        const isSpaceExpanded = expandedSpaces.has(space.id);
                        const isSpaceSelected = value?.type === 'space' && value.id === space.id;

                        return (
                          <div key={space.id} className="ml-6">
                            {/* Space */}
                            <div className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <button
                                onClick={(e) => toggleSpace(space.id, e)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              >
                                <ChevronRight
                                  className={`w-4 h-4 text-gray-400 transition-transform ${isSpaceExpanded ? 'rotate-90' : ''}`}
                                />
                              </button>
                              <button
                                onClick={() => {
                                  onChange({ type: 'space', id: space.id, name: space.name });
                                  setIsOpen(false);
                                }}
                                className="flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${ENTITY_COLORS.space}20` }}
                                >
                                  <FolderOpen
                                    className="w-4 h-4"
                                    style={{ color: ENTITY_COLORS.space }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 text-left">
                                  {space.name}
                                </span>
                                {isSpaceSelected && (
                                  <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                )}
                              </button>
                            </div>

                            {isSpaceExpanded && (
                              <div className="ml-6">
                                {/* Folders under space */}
                                {spaceFolders.map((folder) => {
                                  const folderProjects = projects.filter(
                                    (p) => p.folderId === folder.id
                                  );
                                  const isFolderExpanded = expandedFolders.has(folder.id);
                                  const isFolderSelected =
                                    value?.type === 'folder' && value.id === folder.id;

                                  return (
                                    <div key={folder.id}>
                                      {/* Folder */}
                                      <div className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <button
                                          onClick={(e) => toggleFolder(folder.id, e)}
                                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                        >
                                          <ChevronRight
                                            className={`w-4 h-4 text-gray-400 transition-transform ${isFolderExpanded ? 'rotate-90' : ''}`}
                                          />
                                        </button>
                                        <button
                                          onClick={() => {
                                            onChange({
                                              type: 'folder',
                                              id: folder.id,
                                              name: folder.name,
                                            });
                                            setIsOpen(false);
                                          }}
                                          className="flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                                        >
                                          <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${ENTITY_COLORS.folder}20` }}
                                          >
                                            <Folder
                                              className="w-4 h-4"
                                              style={{ color: ENTITY_COLORS.folder }}
                                            />
                                          </div>
                                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 text-left">
                                            {folder.name}
                                          </span>
                                          {isFolderSelected && (
                                            <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                          )}
                                        </button>
                                      </div>

                                      {/* Projects under folder */}
                                      {isFolderExpanded &&
                                        folderProjects.map((project) => {
                                          const isProjectSelected =
                                            value?.type === 'project' && value.id === project.id;

                                          return (
                                            <div key={project.id} className="ml-6">
                                              <button
                                                onClick={() => {
                                                  onChange({
                                                    type: 'project',
                                                    id: project.id,
                                                    name: project.name,
                                                  });
                                                  setIsOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                              >
                                                <div className="w-4 h-4" /> {/* Spacer */}
                                                <div
                                                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                  style={{
                                                    backgroundColor: `${ENTITY_COLORS.project}20`,
                                                  }}
                                                >
                                                  <FileText
                                                    className="w-4 h-4"
                                                    style={{ color: ENTITY_COLORS.project }}
                                                  />
                                                </div>
                                                <span className="text-sm text-gray-900 dark:text-white flex-1 text-left">
                                                  {project.name}
                                                </span>
                                                {isProjectSelected && (
                                                  <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                                )}
                                              </button>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  );
                                })}

                                {/* Projects directly under space (no folder) */}
                                {spaceProjects.map((project) => {
                                  const isProjectSelected =
                                    value?.type === 'project' && value.id === project.id;

                                  return (
                                    <div key={project.id}>
                                      <button
                                        onClick={() => {
                                          onChange({
                                            type: 'project',
                                            id: project.id,
                                            name: project.name,
                                          });
                                          setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                      >
                                        <div className="w-4 h-4" /> {/* Spacer */}
                                        <div
                                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                                          style={{ backgroundColor: `${ENTITY_COLORS.project}20` }}
                                        >
                                          <FileText
                                            className="w-4 h-4"
                                            style={{ color: ENTITY_COLORS.project }}
                                          />
                                        </div>
                                        <span className="text-sm text-gray-900 dark:text-white flex-1 text-left">
                                          {project.name}
                                        </span>
                                        {isProjectSelected && (
                                          <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
