// src/pages/chat/ChannelMembersPanel.tsx
import React, { useState } from 'react';
import { X, Search, UserPlus, Crown, Circle, Loader2, UserMinus } from 'lucide-react';
import {
  useChannelMembers,
  useJoinChannel,
  useLeaveChannel,
  ChatChannel,
  ChatChannelMember,
} from '../../hooks/api/useChat';
import { useEffectiveMembers } from '../../hooks/api/useMembers';

interface ChannelMembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChatChannel;
  currentUserId: string;
}

export const ChannelMembersPanel: React.FC<ChannelMembersPanelProps> = ({
  isOpen,
  onClose,
  channel,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Get channel members
  const { data: members = [], isLoading, refetch: refetchMembers } = useChannelMembers(channel?.id);

  // Get workspace members for adding - with proper parameters
  const { data: workspaceMembers = [] } = useEffectiveMembers(
    'workspace',
    channel?.workspaceId || '',
    { enabled: !!channel?.workspaceId }
  );

  // Mutations
  const joinChannel = useJoinChannel();
  const leaveChannel = useLeaveChannel();

  // Helper to get user name (handles both uppercase and lowercase)
  const getUserName = (user: any): string => {
    return user?.Name || user?.name || 'Unknown User';
  };

  // Helper to get user email
  const getUserEmail = (user: any): string => {
    return user?.Email || user?.email || 'No email';
  };

  // Helper to get user avatar
  const getUserAvatar = (user: any): string | null => {
    return user?.Avatar || user?.avatar || null;
  };

  // Helper to check if user is online
  const isUserOnline = (user: any): boolean => {
    return user?.Status === 'online' || user?.status === 'online';
  };

  // Filter members based on search
  const filteredMembers = searchQuery
    ? members.filter((m) => {
        const name = getUserName(m.user).toLowerCase();
        const email = getUserEmail(m.user).toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
      })
    : members;

  // Get members who are NOT in the channel (for adding)
  const memberIds = new Set(members.map((m) => m.userId));
  const availableToAdd = workspaceMembers.filter(
    (wm) => !memberIds.has(wm.userId) && wm.userId !== currentUserId
  );

  // Filter available members based on search
  const filteredAvailable = searchQuery
    ? availableToAdd.filter((m) => {
        const name = getUserName(m.user).toLowerCase();
        const email = getUserEmail(m.user).toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
      })
    : availableToAdd;

  // Separate online and offline
  const onlineMembers = filteredMembers.filter((m) => isUserOnline(m.user));
  const offlineMembers = filteredMembers.filter((m) => !isUserOnline(m.user));

  // Handle adding a member
  const handleAddMember = async (userId: string) => {
    setAddingUserId(userId);
    try {
      await joinChannel.mutateAsync({ channelId: channel.id, userId });
      refetchMembers();
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setAddingUserId(null);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Remove this member from the channel?')) return;

    try {
      await leaveChannel.mutateAsync({ channelId: channel.id, userId });
      refetchMembers();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  if (!isOpen) return null;

  const MemberItem: React.FC<{
    member: ChatChannelMember;
    showRemove?: boolean;
  }> = ({ member, showRemove = true }) => {
    const isOwner = member.userId === channel.createdBy;
    const isCurrentUser = member.userId === currentUserId;
    const userName = getUserName(member.user);
    const userEmail = getUserEmail(member.user);
    const userAvatar = getUserAvatar(member.user);
    const isOnline = isUserOnline(member.user);

    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#25282c] group">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userName[0]?.toUpperCase() || '?'
            )}
          </div>
          {/* Status indicator */}
          <Circle
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 stroke-[#1a1d21] stroke-2 ${
              isOnline ? 'text-green-500 fill-green-500' : 'text-gray-500 fill-gray-500'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{userName}</span>
            {isOwner && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
            {isCurrentUser && <span className="text-xs text-[#6b7280]">(you)</span>}
          </div>
          <p className="text-xs text-[#6b7280] truncate">{userEmail}</p>
        </div>

        {/* Actions */}
        {showRemove && !isOwner && !isCurrentUser && (
          <button
            onClick={() => handleRemoveMember(member.userId)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-all"
            title="Remove from channel"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  // Render workspace member for adding
  const AddMemberItem: React.FC<{ workspaceMember: any }> = ({ workspaceMember }) => {
    const userName = getUserName(workspaceMember.user);
    const userEmail = getUserEmail(workspaceMember.user);
    const userAvatar = getUserAvatar(workspaceMember.user);
    const isAdding = addingUserId === workspaceMember.userId;

    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#25282c] group">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            userName[0]?.toUpperCase() || '?'
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white truncate block">{userName}</span>
          <p className="text-xs text-[#6b7280] truncate">{userEmail}</p>
        </div>

        {/* Add button */}
        <button
          onClick={() => handleAddMember(workspaceMember.userId)}
          disabled={isAdding}
          className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 transition-colors disabled:opacity-50"
          title="Add to channel"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="w-[300px] h-full flex flex-col bg-[#1a1d21] border-l border-[#2a2e33]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e33]">
        <h3 className="text-sm font-semibold text-white">
          {showAddMembers ? 'Add Members' : `Members (${members.length})`}
        </h3>
        <div className="flex items-center gap-1">
          {showAddMembers && (
            <button
              onClick={() => {
                setShowAddMembers(false);
                setSearchQuery('');
              }}
              className="text-xs text-brand-400 hover:text-brand-300 mr-2"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#2a2e33] rounded-lg text-[#6b7280] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#2a2e33]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={showAddMembers ? 'Search workspace members...' : 'Find members...'}
            className="w-full pl-8 pr-3 py-1.5 bg-[#25282c] border border-[#2a2e33] rounded-lg text-white placeholder-[#6b7280] text-xs focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </div>

      {/* Add Members Button */}
      {!showAddMembers && (
        <div className="p-3 border-b border-[#2a2e33]">
          <button
            onClick={() => setShowAddMembers(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add People</span>
          </button>
          {channel.type === 'direct' && (
            <p className="text-xs text-[#6b7280] text-center mt-2">
              Adding people will convert this to a group chat
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {showAddMembers ? (
          // Show available workspace members to add
          <>
            {filteredAvailable.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#6b7280]">
                  {searchQuery ? 'No members found' : 'All workspace members are in this channel'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="px-2 mb-2 text-xs font-semibold text-[#6b7280] uppercase">
                  Available to Add — {filteredAvailable.length}
                </p>
                {filteredAvailable.map((wm) => (
                  <AddMemberItem key={wm.userId} workspaceMember={wm} />
                ))}
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 p-2 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-[#2a2e33]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#2a2e33] rounded w-1/2" />
                  <div className="h-2 bg-[#2a2e33] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#6b7280]">No members in this channel</p>
          </div>
        ) : (
          <>
            {/* Online */}
            {onlineMembers.length > 0 && (
              <div className="mb-4">
                <p className="px-2 mb-1 text-xs font-semibold text-[#6b7280] uppercase">
                  Online — {onlineMembers.length}
                </p>
                {onlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </div>
            )}

            {/* Offline */}
            {offlineMembers.length > 0 && (
              <div>
                <p className="px-2 mb-1 text-xs font-semibold text-[#6b7280] uppercase">
                  Offline — {offlineMembers.length}
                </p>
                {offlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
