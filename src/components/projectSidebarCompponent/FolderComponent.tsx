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
    <div className="mb-0.5">
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[#25282c] transition-colors"
        onClick={() => onToggle(folder.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={(e) => onToggle(folder.id, e)}
          className="p-0.5 rounded hover:bg-[#2a2e33] text-[#6b7280]"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        <FolderIcon className="w-3.5 h-3.5 text-[#9ca3af]" />
        <span className="flex-1 text-sm text-[#9ca3af] truncate">{folder.name}</span>

        {isHovered && (
          <button
            onClick={(e) => onManageMembers('folder', folder.id, folder.name, e)}
            className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white"
            title="Manage members"
          >
            <UserPlus className="w-3 h-3" />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="ml-5 pl-3 border-l border-[#2a2e33]">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                space={space}
                isProjectActive={isProjectActive}
                setCurrentSpace={setCurrentSpace}
                setCurrentProject={setCurrentProject}
                onManageMembers={onManageMembers as any}
              />
            ))
          ) : (
            <p className="px-2 py-1.5 text-xs text-[#6b7280] italic">No projects</p>
          )}
        </div>
      )}
    </div>
  );
};
