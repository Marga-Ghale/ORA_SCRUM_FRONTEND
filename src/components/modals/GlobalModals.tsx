import React from 'react';
import CreateSpaceModal from './CreateSpaceModal';
import CreateProjectModal from './CreateProjectModal';
import CreateTaskModal from '../tasks/CreateTaskModal';
import { useProjectContext } from '../../context/ProjectContext';

const GlobalModals: React.FC = () => {
  const {
    isCreateSpaceModalOpen,
    setIsCreateSpaceModalOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
  } = useProjectContext();

  return (
    <>
      <CreateSpaceModal
        isOpen={isCreateSpaceModalOpen}
        onClose={() => setIsCreateSpaceModalOpen(false)}
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
