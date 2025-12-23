// src/pages/chat/CreateDMModal.tsx
import React, { useState, useMemo } from 'react';
import { X, Search, MessageSquare, Check, AlertCircle } from 'lucide-react';
import { useCreateDirectChannel } from '../../hooks/api/useChat';
import { useEffectiveMembers } from '../../hooks/api/useMembers';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../components/UserProfile/AuthContext';

interface CreateDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (channelId: string) => void;
}

export const CreateDMModal: React.FC<CreateDMModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentWorkspace } = useProject();
  const { user: currentUser } = useAuth();
  const { data: members = [], isLoading: membersLoading } = useEffectiveMembers(
    'workspace',
    currentWorkspace?.id || '',
    { enabled: !!currentWorkspace?.id }
  );
  const createDM = useCreateDirectChannel();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter out current user and filter by search
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (member.userId === currentUser?.id) return false;
      if (!searchQuery) return true;

      const name = member.user?.name?.toLowerCase() || '';
      const email = member.user?.email?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();

      return name.includes(query) || email.includes(query);
    });
  }, [members, currentUser?.id, searchQuery]);

  const handleSubmit = async () => {
    if (!selectedUserId || !currentWorkspace) return;
    setError(null);

    try {
      const channel = await createDM.mutateAsync({
        userId: selectedUserId,
        workspaceId: currentWorkspace.id,
      });

      onSuccess?.(channel.id);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to start conversation');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUserId(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1d21] border border-gray-200 dark:border-[#2a2e33] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2a2e33]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Message</h2>
              <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                Start a direct conversation
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

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-[#2a2e33]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#25282c] border border-gray-200 dark:border-[#2a2e33] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#6b7280] text-sm focus:outline-none focus:border-brand-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Members List */}
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {membersLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2a2e33]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-[#2a2e33] rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-[#2a2e33] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-[#6b7280]">
                {searchQuery ? 'No members found' : 'No other members in workspace'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredMembers.map((member) => {
                const isSelected = selectedUserId === member.userId;
                const userName = member.user?.name || 'Unknown';
                const userEmail = member.user?.email || '';
                const userInitial = userName[0]?.toUpperCase() || '?';

                return (
                  <button
                    key={member.userId}
                    onClick={() => setSelectedUserId(member.userId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isSelected ? 'bg-brand-500/20' : 'hover:bg-gray-100 dark:hover:bg-[#25282c]'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                        {member.user?.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={userName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          userInitial
                        )}
                      </div>
                      {/* Online indicator */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1a1d21] rounded-full" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#6b7280]">{userEmail}</p>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-4 border-t border-gray-200 dark:border-[#2a2e33]">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#25282c] hover:bg-gray-200 dark:hover:bg-[#2a2e33] text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedUserId || createDM.isPending}
            className="flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {createDM.isPending ? 'Starting...' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};
