import { ChevronRight, Folder, MoreHorizontal, Plus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { ProjectItem } from './ProjectComponent';
import { FolderItem } from './FolderComponent';

export interface SpaceItemProps {
  space: any;
  projects: any[];
  folders: any[];
  projectsByFolderId: Record<string, any[]>;
  isSpaceExpanded: boolean;
  isHovered: boolean;
  showFull: boolean;
  currentSpace: any;
  projectsLoading: boolean;
  foldersLoading: boolean;
  onToggle: (id: string, e?: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  setCurrentSpace: (space: any) => void;
  setCurrentProject: (project: any) => void;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  isProjectActive: (id: string) => boolean;
  onManageMembers: (
    entityType: 'space' | 'project' | 'folder',
    entityId: string,
    entityName: string,
    e?: React.MouseEvent
  ) => void;
}

export const SpaceItem: React.FC<SpaceItemProps> = ({
  space,
  projects,
  folders,
  projectsByFolderId,
  isSpaceExpanded,
  isHovered,
  showFull,
  currentSpace,
  projectsLoading,
  foldersLoading,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  setCurrentSpace,
  setCurrentProject,
  setIsCreateProjectModalOpen,
  isProjectActive,
  onManageMembers,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Projects NOT in folders
  const rootProjects = projects.filter((p) => !p.folderId);

  return (
    <div className="mb-0.5">
      {/* Space Item */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group
          ${currentSpace?.id === space.id ? 'bg-[#25282c]' : 'hover:bg-[#25282c]'}
          ${!showFull ? 'justify-center' : ''}`}
        onClick={() => {
          setCurrentSpace(space);
          if (showFull) onToggle(space.id);
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {showFull && (
          <button
            onClick={(e) => onToggle(space.id, e)}
            className="p-0.5 rounded hover:bg-[#2a2e33] text-[#6b7280]"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isSpaceExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}

        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0"
          style={{
            backgroundColor: `${space.color || '#7c3aed'}20`,
            color: space.color || '#7c3aed',
          }}
        >
          {space.icon ? <span>{space.icon}</span> : <Folder className="w-3.5 h-3.5" />}
        </div>

        {showFull && (
          <>
            <span className="flex-1 text-sm text-[#e5e7eb] truncate">{space.name}</span>

            <div
              className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <button
                onClick={(e) => onManageMembers('space', space.id, space.name, e)}
                className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white"
                title="Manage members"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSpace(space);
                  setIsCreateProjectModalOpen(true);
                }}
                className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white"
                title="Add project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white"
                title="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Projects & Folders */}
      {showFull && isSpaceExpanded && (
        <div className="ml-5 pl-3 border-l border-[#2a2e33] mt-0.5">
          {projectsLoading || foldersLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-7 bg-[#2a2e33] rounded-md animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Root Projects */}
              {rootProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  space={space}
                  isProjectActive={isProjectActive}
                  setCurrentSpace={setCurrentSpace}
                  setCurrentProject={setCurrentProject}
                  onManageMembers={onManageMembers}
                />
              ))}

              {/* Folders with Projects */}
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  space={space}
                  projects={projectsByFolderId[folder.id] || []}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={toggleFolder}
                  isProjectActive={isProjectActive}
                  setCurrentSpace={setCurrentSpace}
                  setCurrentProject={setCurrentProject}
                  onManageMembers={onManageMembers}
                />
              ))}

              {rootProjects.length === 0 && folders.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-[#6b7280] italic">No projects</p>
              )}
            </>
          )}

          <button
            onClick={() => {
              setCurrentSpace(space);
              setIsCreateProjectModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-[#6b7280] hover:text-white hover:bg-[#25282c] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      )}
    </div>
  );
};
