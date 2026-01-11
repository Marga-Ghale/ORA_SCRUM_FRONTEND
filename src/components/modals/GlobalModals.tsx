// src/components/modals/GlobalModals.tsx
import React from 'react';
import CreateSpaceModal from './CreateSpaceModal';
import CreateFolderModal from './CreateFolderModal';
import CreateProjectModal from './CreateProjectModal';
import CreateTaskModal from '../tasks/CreateTaskModal';
import { useProjectContext } from '../../context/ProjectContext';

const GlobalModals: React.FC = () => {
  const {
    isCreateSpaceModalOpen,
    setIsCreateSpaceModalOpen,
    isCreateFolderModalOpen,
    setIsCreateFolderModalOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
  } = useProjectContext();

  return (
    <>
      <CreateSpaceModal
        isOpen={isCreateSpaceModalOpen}
        onClose={() => setIsCreateSpaceModalOpen(false)}
      />
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
      />
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
      />
      <CreateTaskModal />
    </>
  );
};

export default GlobalModals;
