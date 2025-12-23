import React from 'react';
import CreateSpaceModal from './CreateSpaceModal';
import CreateProjectModal from './CreateProjectModal';
import CreateSprintModal from './CreateSprintModal';
import InviteMemberModal from './InviteMemberModalv1';
import CreateTaskModal from '../tasks/CreateTaskModal';
import { useProjectContext } from '../../context/ProjectContext';

const GlobalModals: React.FC = () => {
  const {
    isCreateSpaceModalOpen,
    setIsCreateSpaceModalOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    isCreateTaskModalOpen,
    setIsCreateTaskModalOpen,
    createTaskInitialStatus,
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
    </>
  );
};

export default GlobalModals;
