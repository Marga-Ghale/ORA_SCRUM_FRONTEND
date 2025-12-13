// src/components/workspace/WorkspaceSettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../context/ProjectContext';
import MembersList from '../members/MembersList';
import { InviteMemberModal } from '../modals';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'members' | 'billing' | 'danger';

const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentWorkspace } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>('members'); // Default to members
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form state
  const [name, setName] = useState('');

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showInviteModal) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, showInviteModal]);

  if (!isOpen || !currentWorkspace) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-56 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Workspace Settings
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 truncate">
            {currentWorkspace.name}
          </p>

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white'
                    : tab.id === 'danger'
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <MembersList
                type="workspace"
                targetId={currentWorkspace.id}
                onInvite={() => setShowInviteModal(true)}
              />
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Free Plan</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You're currently on the free plan with unlimited features.
                </p>
                <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="p-4 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/20">
                <h4 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                  Delete Workspace
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  Deleting a workspace will permanently remove all spaces, projects, tasks, and data.
                  This action cannot be undone.
                </p>
                <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Delete Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          type="workspace"
          targetId={currentWorkspace.id}
          targetName={currentWorkspace.name}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WorkspaceSettingsModal;