import { ChevronRight, FolderIcon, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { ProjectItem } from './ProjectComponent';

// ✅ NEW COMPONENT
export interface FolderItemProps {
  folder: any;
  space: any;
  projects: any[];
  isExpanded: boolean;
  onToggle: (id: string, e?: React.MouseEvent) => void;
  isProjectActive: (id: string) => boolean;
  setCurrentSpace: (space: any) => void;
  setCurrentProject: (project: any) => void;
  onManageMembers: (
    entityType: 'folder',
    entityId: string,
    entityName: string,
    e?: React.MouseEvent
  ) => void;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  space,
  projects,
  isExpanded,
  onToggle,
  isProjectActive,
  setCurrentSpace,
  setCurrentProject,
  onManageMembers,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="mb-1">
      <div
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer 
          hover:bg-gray-100 dark:hover:bg-[#25282c] 
          transition-all duration-200 group
          active:scale-[0.98]"
        onClick={() => onToggle(folder.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={(e) => onToggle(folder.id, e)}
          className="p-1 rounded-lg 
            hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
            text-gray-500 dark:text-[#6b7280]
            hover:text-gray-700 dark:hover:text-white
            transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        <div
          className="p-1 rounded-lg 
          bg-gray-100 dark:bg-[#25282c] 
          group-hover:bg-gray-200 dark:group-hover:bg-[#2a2e33]
          transition-all duration-200 group-hover:scale-105"
        >
          <FolderIcon className="w-3.5 h-3.5 text-gray-600 dark:text-[#9ca3af]" />
        </div>
        <span
          className="flex-1 text-sm font-medium text-gray-700 dark:text-[#9ca3af] 
          truncate group-hover:text-gray-900 dark:group-hover:text-white 
          transition-colors duration-200"
        >
          {folder.name}
        </span>

        <button
          onClick={(e) => onManageMembers('folder', folder.id, folder.name, e)}
          className={`p-1.5 rounded-lg 
            hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
            text-gray-500 dark:text-[#6b7280] 
            hover:text-gray-700 dark:hover:text-white
            transition-all duration-200 hover:scale-110 active:scale-95
            ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}
          title="Manage members"
        >
          <UserPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div
          className="ml-6 pl-3 border-l-2 border-gray-200 dark:border-[#2a2e33] 
          animate-in slide-in-from-top-2 duration-300"
        >
          {projects.length > 0 ? (
            <div className="space-y-0.5">
              {projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  space={space}
                  isProjectActive={isProjectActive}
                  setCurrentSpace={setCurrentSpace}
                  setCurrentProject={setCurrentProject}
                  onManageMembers={onManageMembers as any}
                />
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 text-center">
              <p className="text-xs font-medium text-gray-500 dark:text-[#6b7280] italic">
                No projects yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
