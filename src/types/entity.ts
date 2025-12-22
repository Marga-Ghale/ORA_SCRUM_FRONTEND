// ✅ NEW FILE: src/types/entity.ts

export type EntityType = 'workspace' | 'space' | 'folder' | 'project';

export interface Entity {
  id: string;
  name: string;
  description?: string;
}

export interface WorkspaceEntity extends Entity {
  type: 'workspace';
}

export interface SpaceEntity extends Entity {
  type: 'space';
  workspaceId: string;
  workspaceName?: string;
}

export interface FolderEntity extends Entity {
  type: 'folder';
  spaceId: string;
  spaceName?: string;
}

export interface ProjectEntity extends Entity {
  type: 'project';
  spaceId: string;
  spaceName?: string;
  folderId?: string;
  folderName?: string;
}

export type AnyEntity = WorkspaceEntity | SpaceEntity | FolderEntity | ProjectEntity;
