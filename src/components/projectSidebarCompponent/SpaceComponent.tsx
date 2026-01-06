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
    <div className="mb-1">
      {/* Space Item */}
      <div
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200 group
          ${
            currentSpace?.id === space.id
              ? 'bg-violet-100 dark:bg-[#25282c] shadow-sm'
              : 'hover:bg-gray-100 dark:hover:bg-[#25282c]'
          }
          ${!showFull ? 'justify-center' : ''}
          active:scale-[0.98]`}
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
            className="p-1 rounded-lg 
              hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
              text-gray-500 dark:text-[#6b7280]
              hover:text-gray-700 dark:hover:text-white
              transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-300 ${isSpaceExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}

        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0
            shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
          style={{
            backgroundColor: `${space.color || '#7c3aed'}20`,
            color: space.color || '#7c3aed',
          }}
        >
          {space.icon ? (
            <span className="text-sm">{space.icon}</span>
          ) : (
            <Folder className="w-4 h-4" />
          )}
        </div>

        {showFull && (
          <>
            <span
              className={`flex-1 text-sm font-medium truncate transition-colors duration-200
              ${
                currentSpace?.id === space.id
                  ? 'text-gray-900 dark:text-[#e5e7eb]'
                  : 'text-gray-700 dark:text-[#e5e7eb]'
              }`}
            >
              {space.name}
            </span>

            <div
              className={`flex items-center gap-0.5 transition-all duration-200 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}
            >
              <button
                onClick={(e) => onManageMembers('space', space.id, space.name, e)}
                className="p-1.5 rounded-lg 
                  hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
                  text-gray-500 dark:text-[#6b7280] 
                  hover:text-gray-700 dark:hover:text-white
                  transition-all duration-200 hover:scale-110 active:scale-95"
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
                className="p-1.5 rounded-lg 
                  hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
                  text-gray-500 dark:text-[#6b7280] 
                  hover:text-gray-700 dark:hover:text-white
                  transition-all duration-200 hover:scale-110 active:scale-95"
                title="Add project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 rounded-lg 
                  hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
                  text-gray-500 dark:text-[#6b7280] 
                  hover:text-gray-700 dark:hover:text-white
                  transition-all duration-200 hover:scale-110 active:scale-95"
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
        <div
          className="ml-6 pl-3 border-l-2 border-gray-200 dark:border-[#2a2e33] mt-1 
          animate-in slide-in-from-top-2 duration-300"
        >
          {projectsLoading || foldersLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 dark:bg-[#2a2e33] rounded-xl animate-pulse"
                />
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
                <div className="px-3 py-3 text-center">
                  <p className="text-xs font-medium text-gray-500 dark:text-[#6b7280] italic">
                    No projects yet
                  </p>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => {
              setCurrentSpace(space);
              setIsCreateProjectModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
              text-gray-600 dark:text-[#6b7280] 
              hover:text-gray-900 dark:hover:text-white 
              hover:bg-gray-100 dark:hover:bg-[#25282c] 
              transition-all duration-200 group
              active:scale-[0.98] mt-1"
          >
            <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
            <span>Add Project</span>
          </button>
        </div>
      )}
    </div>
  );
};
