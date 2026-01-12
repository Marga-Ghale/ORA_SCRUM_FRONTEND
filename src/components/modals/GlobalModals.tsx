// src/components/modals/GlobalModals.tsx - FIXED VERSION
import React from 'react';
import CreateSpaceModal from './CreateSpaceModal';
import CreateFolderModal from './CreateFolderModal';
import { useProjectContext } from '../../context/ProjectContext';
import { CreateProjectModal } from '.';

const GlobalModals: React.FC = () => {
  const {
    isCreateSpaceModalOpen,
    setIsCreateSpaceModalOpen,
    isCreateFolderModalOpen,
    setIsCreateFolderModalOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    createProject,
    createSpace,
    createFolder,
    creationContext,
    setCreationContext,
    currentSpace,
  } = useProjectContext();

  // ✅ Debug logging
  console.log('🔍 GlobalModals - creationContext:', creationContext);
  console.log('🔍 GlobalModals - currentSpace:', currentSpace?.id);

  return (
    <>
      <CreateSpaceModal
        isOpen={isCreateSpaceModalOpen}
        onClose={() => setIsCreateSpaceModalOpen(false)}
        onCreate={createSpace}
      />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => {
          setIsCreateFolderModalOpen(false);
          // ✅ Clear creation context when closing
          setCreationContext({
            spaceId: null,
            spaceName: null,
            folderId: null,
            folderName: null,
          });
        }}
        onCreate={async (data) => {
          await createFolder({
            ...data,
            spaceId: creationContext?.spaceId || currentSpace?.id || undefined,
          });
        }}
      />

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => {
          setIsCreateProjectModalOpen(false);
          // ✅ Clear creation context when closing
          setCreationContext({
            spaceId: null,
            spaceName: null,
            folderId: null,
            folderName: null,
          });
        }}
        onCreate={createProject}
        // ✅ Pass context values to modal
        spaceId={creationContext?.spaceId ?? undefined}
        folderId={creationContext?.folderId ?? undefined}
        parentName={creationContext?.folderName || creationContext?.spaceName || undefined}
        parentType={creationContext?.folderId ? 'folder' : 'space'}
      />
    </>
  );
};

export default GlobalModals;
