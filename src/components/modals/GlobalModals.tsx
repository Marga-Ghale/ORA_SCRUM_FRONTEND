import React from 'react';
import { useProject } from '../../context/ProjectContext';
import CreateSpaceModal from './CreateSpaceModal';
import CreateProjectModal from './CreateProjectModal';
import CreateSprintModal from './CreateSprintModal';
import InviteMemberModal from './InviteMemberModalv1';
import CreateTaskModal from '../tasks/CreateTaskModal';

const GlobalModals: React.FC = () => {
  const {
    isCreateSpaceModalOpen,
    setIsCreateSpaceModalOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    isCreateSprintModalOpen,
    setIsCreateSprintModalOpen,
    isInviteMemberModalOpen,
    setIsInviteMemberModalOpen,
    isCreateTaskModalOpen,
    setIsCreateTaskModalOpen,
    createTaskInitialStatus,
  } = useProject();

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
      <CreateSprintModal
        isOpen={isCreateSprintModalOpen}
        onClose={() => setIsCreateSprintModalOpen(false)}
      />
      <InviteMemberModal
        isOpen={isInviteMemberModalOpen}
        onClose={() => setIsInviteMemberModalOpen(false)}
      />
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        initialStatus={createTaskInitialStatus}
      />
    </>
  );
};

export default GlobalModals;
