// src/pages/chat/ChannelMembersPanel.tsx
import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Crown, Circle, Loader2, UserMinus, ChevronLeft } from 'lucide-react';
import {
  useChannelMembers,
  useJoinChannel,
  useLeaveChannel,
  ChatChannel,
  ChatChannelMember,
} from '../../hooks/api/useChat';
import { useEffectiveMembers } from '../../hooks/api/useMembers';
import { queryClient, queryKeys } from '../../lib/query-client';

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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Get channel members
  const {
    data: members = [],
    isLoading,
    refetch: refetchMembers,
  } = useChannelMembers(channel?.id, {
    enabled: !!channel?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  // Get workspace members for adding
  const { data: workspaceMembers = [] } = useEffectiveMembers(
    'workspace',
    channel?.workspaceId || '',
    { enabled: !!channel?.workspaceId }
  );

  // Mutations
  const joinChannel = useJoinChannel();
  const leaveChannel = useLeaveChannel();

  // Helper functions
  const getUserName = (user: any): string => {
    return user?.Name || user?.name || 'Unknown User';
  };

  const getUserEmail = (user: any): string => {
    return user?.Email || user?.email || 'No email';
  };

  const getUserAvatar = (user: any): string | null => {
    return user?.Avatar || user?.avatar || null;
  };

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

  const handleRemoveMember = async (userId: string) => {
    try {
      await leaveChannel.mutateAsync({ channelId: channel.id, userId });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.members(channel.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
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
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#25282c] group transition-colors">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs sm:text-sm">{userName[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <Circle
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 stroke-white dark:stroke-[#1a1d21] stroke-2 ${
              isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
            }`}
          />
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
              {userName}
            </span>
            {isOwner && (
              <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 flex-shrink-0" />
            )}
            {isCurrentUser && (
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#6b7280] flex-shrink-0">
                (you)
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-[#6b7280] truncate">
            {userEmail}
          </p>
        </div>

        {/* Remove button */}
        {showRemove &&
          (() => {
            const isOwner =
              member.userId === channel.createdBy || member.userId === (channel as any).CreatedBy;
            const isCurrentUser = member.userId === currentUserId;
            const creatorId = (channel as any).createdBy || (channel as any).CreatedBy;
            const isCreator = currentUserId === creatorId;

            if (isOwner || isCurrentUser) return null;
            if (channel.type === 'direct') return null;
            if (channel.type === 'group') return null;
            if (!isCreator) return null;

            return (
              <button
                onClick={() => handleRemoveMember(member.userId)}
                className="
    p-2.5 sm:p-2
    rounded-lg

    opacity-100 sm:opacity-0 sm:group-hover:opacity-100

    text-red-400 sm:text-gray-400
    bg-red-500/10 sm:bg-transparent

    sm:hover:bg-red-500/20
    sm:hover:text-red-400

    transition-all
    flex-shrink-0
  "
                title="Remove from channel"
              >
                <UserMinus className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            );
          })()}
      </div>
    );
  };

  const AddMemberItem: React.FC<{ member: any }> = ({ member }) => {
    const userName = getUserName(member.user);
    const userEmail = getUserEmail(member.user);
    const userAvatar = getUserAvatar(member.user);
    const isAdding = addingUserId === member.userId;

    return (
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#25282c] transition-colors">
        {/* Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white overflow-hidden flex-shrink-0">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs sm:text-sm">{userName[0]?.toUpperCase() || '?'}</span>
          )}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate block max-w-[140px] sm:max-w-full">
            {userName}
          </span>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-[#6b7280] truncate">
            {userEmail}
          </p>
        </div>

        {/* Add button */}
        <button
          onClick={() => handleAddMember(member.userId)}
          disabled={isAdding}
          className="
    p-2.5 sm:p-2
    rounded-lg

    bg-brand-500 sm:bg-brand-500
    sm:hover:bg-brand-600

    text-white
    transition-all
    disabled:opacity-50

    flex-shrink-0
    active:scale-95
  "
          title="Add to channel"
        >
          {isAdding ? (
            <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <UserPlus className="w-5 h-5 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop overlay - Only on mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed md:relative
          inset-y-0 right-0
          z-50 md:z-auto
          w-full max-w-[320px] sm:max-w-[360px] md:w-[300px] lg:w-[320px]
          h-full
          flex flex-col
          bg-white dark:bg-[#1a1d21]
          border-l border-gray-200 dark:border-[#2a2e33]
          shadow-xl md:shadow-none
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-[#2a2e33] bg-white dark:bg-[#1a1d21]">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back button for Add Members view */}
            {showAddMembers && (
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a2e33] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
              {showAddMembers ? 'Add Members' : `Members (${members.length})`}
            </h3>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Add members button - Only show when not in add mode */}
            {!showAddMembers && channel.type !== 'direct' && (
              <button
                onClick={() => setShowAddMembers(true)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#2a2e33] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Add members"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#2a2e33] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-[#2a2e33]">
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={showAddMembers ? 'Search workspace members...' : 'Find members...'}
              className="w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 bg-gray-100 dark:bg-[#25282c] border border-transparent focus:border-brand-500/50 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#6b7280] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin mb-2" />
              <span className="text-sm text-gray-500 dark:text-[#6b7280]">Loading members...</span>
            </div>
          ) : showAddMembers ? (
            // Add Members View
            <>
              {filteredAvailable.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <UserPlus className="w-10 h-10 text-gray-400 dark:text-[#4a4e53] mb-3" />
                  <p className="text-sm text-gray-500 dark:text-[#6b7280]">
                    {searchQuery
                      ? 'No members found matching your search'
                      : 'All workspace members are already in this channel'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="px-2 py-1 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wide">
                    Available to add — {filteredAvailable.length}
                  </p>
                  {filteredAvailable.map((m) => (
                    <AddMemberItem key={m.userId} member={m} />
                  ))}
                </div>
              )}
            </>
          ) : (
            // Members List View
            <>
              {filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Search className="w-10 h-10 text-gray-400 dark:text-[#4a4e53] mb-3" />
                  <p className="text-sm text-gray-500 dark:text-[#6b7280]">
                    No members found matching "{searchQuery}"
                  </p>
                </div>
              ) : (
                <>
                  {/* Online Members */}
                  {onlineMembers.length > 0 && (
                    <div className="mb-4">
                      <p className="px-2 py-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wide sticky top-0 bg-white dark:bg-[#1a1d21]">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 align-middle"></span>
                        Online — {onlineMembers.length}
                      </p>
                      <div className="space-y-0.5">
                        {onlineMembers.map((m) => (
                          <MemberItem key={m.id} member={m} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offline Members */}
                  {offlineMembers.length > 0 && (
                    <div>
                      <p className="px-2 py-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wide sticky top-0 bg-white dark:bg-[#1a1d21]">
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1.5 align-middle"></span>
                        Offline — {offlineMembers.length}
                      </p>
                      <div className="space-y-0.5">
                        {offlineMembers.map((m) => (
                          <MemberItem key={m.id} member={m} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer - Quick stats on mobile */}
        {!showAddMembers && members.length > 0 && (
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-[#2a2e33] bg-gray-50 dark:bg-[#15171a]">
            <div className="flex items-center justify-center gap-4 text-[11px] sm:text-xs text-gray-500 dark:text-[#6b7280]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {onlineMembers.length} online
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                {offlineMembers.length} offline
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
