/* eslint-disable @typescript-eslint/no-unused-vars */

// src/pages/chat/CreateChannelModal.tsx
import React, { useState } from 'react';
import { X, Hash, Lock, Globe, Users, Folder, Briefcase, AlertCircle } from 'lucide-react';
import { useCreateChannel } from '../../hooks/api/useChat';
import { useProjectContext } from '../../context/ProjectContext';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (channelId: string) => void;
}

type ChannelType = 'team' | 'project' | 'space';

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentWorkspace, allSpaces } = useProjectContext();
  const createChannel = useCreateChannel();

  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>('team');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get all projects from spaces
  const allProjects =
    allSpaces?.flatMap(
      (space) =>
        space.projects?.map((project) => ({
          ...project,
          spaceName: space.name,
        })) || []
    ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !currentWorkspace) {
      setError('Please enter a channel name');
      return;
    }

    // For team channels, use workspace ID as targetId
    // For project/space channels, generate a unique targetId by combining with name
    let targetId: string;

    if (channelType === 'team') {
      // For team channels, make targetId unique by including the channel name
      targetId = `${currentWorkspace.id}_${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
    } else {
      if (!selectedTargetId) {
        setError(`Please select a ${channelType}`);
        return;
      }
      // For project/space channels, include name to allow multiple channels
      targetId = `${selectedTargetId}_${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
    }

    try {
      const channel = await createChannel.mutateAsync({
        name: name.trim(),
        type: channelType,
        targetId,
        workspaceId: currentWorkspace.id,
        isPrivate,
      });

      onSuccess?.(channel.id);
      handleClose();
    } catch (err: any) {
      // Handle duplicate channel error
      if (err?.message?.includes('duplicate') || err?.message?.includes('unique')) {
        setError('A channel with this name already exists. Please choose a different name.');
      } else {
        setError(err?.message || 'Failed to create channel. Please try again.');
      }
    }
  };

  const handleClose = () => {
    setName('');
    setChannelType('team');
    setIsPrivate(false);
    setSelectedTargetId('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1d21] border border-gray-200 dark:border-[#2a2e33] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2a2e33]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Hash className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Channel
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                Channels are for team conversations
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2e33] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Channel Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#9ca3af] mb-2">
              Channel Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  type: 'team' as ChannelType,
                  icon: Users,
                  label: 'Team',
                  desc: 'General workspace channel',
                },
                {
                  type: 'project' as ChannelType,
                  icon: Briefcase,
                  label: 'Project',
                  desc: 'Project-specific channel',
                },
                {
                  type: 'space' as ChannelType,
                  icon: Folder,
                  label: 'Space',
                  desc: 'Space-wide channel',
                },
              ].map(({ type, icon: Icon, label, desc }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setChannelType(type);
                    setSelectedTargetId('');
                    setError(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                    channelType === type
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                      : 'bg-gray-50 dark:bg-[#25282c] border-gray-200 dark:border-[#2a2e33] text-gray-600 dark:text-[#9ca3af] hover:border-gray-300 dark:hover:border-[#3a3e43]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Selection (for project/space channels) */}
          {channelType !== 'team' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#9ca3af] mb-2">
                Select {channelType === 'project' ? 'Project' : 'Space'}
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  setSelectedTargetId(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#25282c] border border-gray-200 dark:border-[#2a2e33] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-brand-500/50"
              >
                <option value="">Select a {channelType === 'project' ? 'project' : 'space'}</option>
                {channelType === 'project'
                  ? allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.spaceName} / {project.name}
                      </option>
                    ))
                  : allSpaces?.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
              </select>
            </div>
          )}

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#9ca3af] mb-2">
              Channel Name
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#6b7280]" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  setError(null);
                }}
                placeholder="e.g. general, announcements, dev-team"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#25282c] border border-gray-200 dark:border-[#2a2e33] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#6b7280] text-sm focus:outline-none focus:border-brand-500/50"
                required
                maxLength={50}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#6b7280]">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#25282c] rounded-xl">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock className="w-5 h-5 text-gray-600 dark:text-[#9ca3af]" />
              ) : (
                <Globe className="w-5 h-5 text-gray-600 dark:text-[#9ca3af]" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {isPrivate ? 'Private Channel' : 'Public Channel'}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                  {isPrivate
                    ? 'Only invited members can see this channel'
                    : 'Anyone in the workspace can join'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isPrivate ? 'bg-brand-500' : 'bg-gray-300 dark:bg-[#3a3e43]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isPrivate ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#25282c] hover:bg-gray-200 dark:hover:bg-[#2a2e33] text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createChannel.isPending}
              className="flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {createChannel.isPending ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
