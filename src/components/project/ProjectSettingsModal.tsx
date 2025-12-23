// src/components/project/ProjectSettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import MembersList from '../members/MembersList';
import { InviteMemberModal } from '../modals';
import { useProjectContext } from '../../context/ProjectContext';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'members' | 'labels' | 'danger';

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, updateProject, deleteProject } = useProjectContext();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Form state for general settings
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name);
      setKey(currentProject.key);
      setDescription(currentProject.description || '');
      setColor(currentProject.color || '#6366F1');
    }
  }, [currentProject]);

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

  const handleSaveGeneral = () => {
    if (!currentProject) return;
    updateProject(currentProject.id, {
      name,
      description,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!currentProject || deleteInput !== currentProject.key) return;
    deleteProject(currentProject.id);
    onClose();
  };

  if (!isOpen || !currentProject) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'labels', label: 'Labels', icon: '🏷️' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
  ];

  const PRESET_COLORS = [
    '#EF4444',
    '#F97316',
    '#F59E0B',
    '#EAB308',
    '#84CC16',
    '#22C55E',
    '#10B981',
    '#14B8A6',
    '#06B6D4',
    '#0EA5E9',
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#A855F7',
    '#D946EF',
    '#EC4899',
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
            Project Settings
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 truncate">
            {currentProject.name}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>

                {/* Project Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Key
                  </label>
                  <input
                    type="text"
                    value={key}
                    disabled
                    className="w-full px-4 py-3 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Project key cannot be changed</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none transition-all"
                    placeholder="Describe your project..."
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          color === c
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSaveGeneral}
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <MembersList
                type="project"
                targetId={currentProject.id}
                onInvite={() => setShowInviteModal(true)}
              />
            )}

            {/* Labels Tab */}
            {activeTab === 'labels' && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Label management coming soon</p>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="p-4 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <h4 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                    Delete Project
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Once you delete a project, there is no going back. This will permanently delete
                    the project, all tasks, sprints, and associated data.
                  </p>

                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete Project
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Type <strong className="text-red-600">{currentProject.key}</strong> to
                        confirm:
                      </p>
                      <input
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                        placeholder={currentProject.key}
                        className="w-full px-4 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleteInput !== currentProject.key}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          I understand, delete this project
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete(false);
                            setDeleteInput('');
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProjectSettingsModal;
