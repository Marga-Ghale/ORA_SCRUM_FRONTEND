// src/pages/chat/ChannelList.tsx
import React, { useState, useMemo } from 'react';
import {
  Hash,
  Search,
  Plus,
  ChevronRight,
  Lock,
  Circle,
  Star,
  MoreHorizontal,
  Settings,
  Trash2,
  BellOff,
  LogOut,
  X,
  MessageSquare,
  Menu,
} from 'lucide-react';
import {
  ChatChannel,
  getChannelDisplayName,
  isDMChannel,
  isGroupDMChannel,
  canDeleteChannel,
  canLeaveChannel,
  useDeleteChannel,
  useLeaveChannel,
} from '../../hooks/api/useChat';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

interface ChannelListProps {
  channels: ChatChannel[];
  activeChannelId?: string;
  unreadCounts: Record<string, number>;
  currentUserId: string;
  onSelectChannel: (channel: ChatChannel) => void;
  onCreateChannel: () => void;
  onCreateDM: () => void;
  isLoading?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  unreadCounts,
  currentUserId,
  onSelectChannel,
  onCreateChannel,
  onCreateDM,
  isLoading = false,
  isMinimized = false,
  onToggleMinimize,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['channels', 'direct', 'starred'])
  );
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    channelId: string;
    x: number;
    y: number;
  } | null>(null);
  const [starredChannels, setStarredChannels] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState<{
    type: 'leave' | 'delete';
    channelId: string;
    channelName: string;
  } | null>(null);

  const deleteChannel = useDeleteChannel();
  const leaveChannelMutation = useLeaveChannel();

  const handleLeaveChannel = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;

    setConfirmModal({
      type: 'leave',
      channelId,
      channelName: getChannelDisplayName(channel, currentUserId),
    });
    setContextMenu(null);
  };

  const handleDeleteChannel = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;

    setConfirmModal({
      type: 'delete',
      channelId,
      channelName: getChannelDisplayName(channel, currentUserId),
    });
    setContextMenu(null);
  };

  const confirmAction = async () => {
    if (!confirmModal) return;

    try {
      if (confirmModal.type === 'leave') {
        await leaveChannelMutation.mutateAsync({
          channelId: confirmModal.channelId,
        });
        if (confirmModal.channelId === activeChannelId) {
          const remainingChannels = channels.filter((c) => c.id !== confirmModal.channelId);
          if (remainingChannels.length > 0) {
            navigate(`/chat/${remainingChannels[0].id}`);
          } else {
            navigate('/chat');
          }
        }
      } else {
        await deleteChannel.mutateAsync(confirmModal.channelId);
        if (confirmModal.channelId === activeChannelId) {
          const remainingChannels = channels.filter((c) => c.id !== confirmModal.channelId);
          if (remainingChannels.length > 0) {
            navigate(`/chat/${remainingChannels[0].id}`);
          } else {
            navigate('/chat');
          }
        }
      }
    } finally {
      setConfirmModal(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const categorizedChannels = useMemo(() => {
    const starred: ChatChannel[] = [];
    const projectChannels: ChatChannel[] = [];
    const directMessages: ChatChannel[] = [];

    channels.forEach((channel) => {
      if (starredChannels.has(channel.id)) {
        starred.push(channel);
      }
      if (isDMChannel(channel) || isGroupDMChannel(channel)) {
        directMessages.push(channel);
      } else {
        projectChannels.push(channel);
      }
    });

    return { starred, projectChannels, directMessages };
  }, [channels, starredChannels]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return categorizedChannels;

    const query = searchQuery.toLowerCase();
    const filterChannel = (channel: ChatChannel) => {
      const name = (getChannelDisplayName(channel, currentUserId) || '').toLowerCase();
      return name.includes(query);
    };

    return {
      starred: categorizedChannels.starred.filter(filterChannel),
      projectChannels: categorizedChannels.projectChannels.filter(filterChannel),
      directMessages: categorizedChannels.directMessages.filter(filterChannel),
    };
  }, [categorizedChannels, searchQuery, currentUserId]);

  const totalUnread = useMemo(() => {
    const channelUnread = filteredChannels.projectChannels.reduce(
      (sum, c) => sum + (unreadCounts[c.id] || 0),
      0
    );
    const dmUnread = filteredChannels.directMessages.reduce(
      (sum, c) => sum + (unreadCounts[c.id] || 0),
      0
    );
    return { channels: channelUnread, dms: dmUnread };
  }, [filteredChannels, unreadCounts]);

  const handleContextMenu = (e: React.MouseEvent, channelId: string) => {
    e.preventDefault();
    setContextMenu({ channelId, x: e.clientX, y: e.clientY });
  };

  const toggleStar = (channelId: string) => {
    setStarredChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
    setContextMenu(null);
  };

  // Channel Item Component
  const ChannelItem: React.FC<{
    channel: ChatChannel;
    showType?: boolean;
  }> = ({ channel, showType = false }) => {
    const isActive = channel.id === activeChannelId;
    const unread = unreadCounts[channel.id] || 0;
    const isHovered = hoveredChannel === channel.id;

    const displayName = getChannelDisplayName(channel, currentUserId) || 'Unknown';
    const isStarred = starredChannels.has(channel.id);
    const isDM = isDMChannel(channel) || isGroupDMChannel(channel);

    if (isMinimized) {
      return (
        <button
          onClick={() => onSelectChannel(channel)}
          onContextMenu={(e) => handleContextMenu(e, channel.id)}
          className={`w-full flex items-center justify-center p-2 rounded-lg transition-all relative group
            ${
              isActive
                ? 'bg-brand-500/20 text-brand-400'
                : unread > 0
                  ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#25282c]'
                  : 'text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#25282c]'
            }`}
          title={displayName}
        >
          {isDM ? (
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
                {channel.otherUser?.avatar ? (
                  <img
                    src={channel.otherUser.avatar}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (displayName?.[0] || '?').toUpperCase()
                )}
              </div>
              <Circle
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 stroke-white dark:stroke-[#1a1d21] stroke-2 ${
                  channel.otherUser?.status === 'online'
                    ? 'text-green-500 fill-green-500'
                    : 'text-gray-500 fill-gray-500'
                }`}
              />
              {unread > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  isActive ? 'bg-brand-500/30' : 'bg-gray-200 dark:bg-[#2a2e33]'
                }`}
              >
                <Hash
                  className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-gray-500 dark:text-[#6b7280]'}`}
                />
              </div>
              {unread > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </div>
              )}
            </div>
          )}
        </button>
      );
    }

    return (
      <button
        onClick={() => onSelectChannel(channel)}
        onContextMenu={(e) => handleContextMenu(e, channel.id)}
        onMouseEnter={() => setHoveredChannel(channel.id)}
        onMouseLeave={() => setHoveredChannel(null)}
        className={`w-full flex items-center gap-2 sm:gap-2.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all group relative
          ${
            isActive
              ? 'bg-brand-500/20 text-brand-400'
              : unread > 0
                ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#25282c]'
                : 'text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#25282c] hover:text-gray-900 dark:hover:text-white'
          }`}
      >
        {isDM ? (
          <div className="relative flex-shrink-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-[9px] sm:text-[10px] font-medium text-white">
              {channel.otherUser?.avatar ? (
                <img
                  src={channel.otherUser.avatar}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (displayName?.[0] || '?').toUpperCase()
              )}
            </div>
            <Circle
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-white dark:stroke-[#1a1d21] stroke-2 ${
                channel.otherUser?.status === 'online'
                  ? 'text-green-500 fill-green-500'
                  : 'text-gray-500 fill-gray-500'
              }`}
            />
          </div>
        ) : (
          <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
              isActive ? 'bg-brand-500/30' : 'bg-gray-200 dark:bg-[#2a2e33]'
            }`}
          >
            <Hash
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-brand-400' : 'text-gray-500 dark:text-[#6b7280]'}`}
            />
          </div>
        )}

        <span
          className={`flex-1 truncate text-left ${unread > 0 ? 'font-semibold' : 'font-medium'}`}
        >
          {displayName}
        </span>

        {showType && (
          <span className="hidden sm:inline text-[9px] sm:text-[10px] text-gray-500 dark:text-[#6b7280] uppercase">
            {isDM ? 'DM' : channel.type}
          </span>
        )}

        {channel.isPrivate && !isDM && (
          <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-500 dark:text-[#6b7280] flex-shrink-0" />
        )}

        {isStarred && !showType && (
          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
        )}

        {unread > 0 && (
          <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[16px] sm:min-w-[18px] text-center flex-shrink-0">
            {unread > 99 ? '99+' : unread}
          </span>
        )}

        {isHovered && !unread && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, channel.id);
            }}
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-[#3a3e43] text-gray-500 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </button>
    );
  };

  const SectionHeader: React.FC<{
    title: string;
    section: string;
    count: number;
    unreadCount?: number;
    onAdd?: () => void;
  }> = ({ title, section, count, unreadCount = 0, onAdd }) => {
    const isExpanded = expandedSections.has(section);

    if (isMinimized) {
      return null;
    }

    return (
      <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 group">
        <button
          onClick={() => toggleSection(section)}
          className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider hover:text-gray-700 dark:hover:text-[#9ca3af] transition-colors"
        >
          <ChevronRight
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
          <span>{title}</span>
        </button>

        <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-[#6b7280] px-1 sm:px-1.5 py-0.5 bg-gray-100 dark:bg-[#25282c] rounded ml-0.5 sm:ml-1">
          {count}
        </span>

        {unreadCount > 0 && (
          <span className="text-[9px] sm:text-[10px] font-bold text-red-400 ml-auto mr-1">
            {unreadCount} new
          </span>
        )}

        {onAdd && (
          <button
            onClick={onAdd}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2a2e33] text-gray-500 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all ml-auto"
            title={`Add ${title.toLowerCase()}`}
          >
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="p-2 space-y-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 animate-pulse">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gray-200 dark:bg-[#2a2e33]" />
          {!isMinimized && (
            <div
              className="h-3 sm:h-4 bg-gray-200 dark:bg-[#2a2e33] rounded flex-1"
              style={{ width: `${Math.random() * 40 + 40}%` }}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1d21] border-r border-gray-200 dark:border-[#2a2e33]">
      {/* Header */}
      <div className="p-5 sm:p-3 border-b border-gray-200 dark:border-[#2a2e33]">
        {!isMinimized && (
          <>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Messages
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {onToggleMinimize && (
                  <button
                    onClick={onToggleMinimize}
                    className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2e33] text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Toggle sidebar"
                  >
                    <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <button
                  onClick={onCreateChannel}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2e33] text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Create channel"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-[#6b7280]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-gray-50 dark:bg-[#25282c] border border-gray-200 dark:border-[#2a2e33] rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#6b7280] focus:outline-none focus:border-brand-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3a3e43] text-gray-500 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          </>
        )}

        {isMinimized && onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2e33] text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Expand sidebar"
          >
            <MessageSquare className="w-5 h-5 mx-auto text-brand-400" />
          </button>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <LoadingSkeleton />
        ) : channels.length === 0 ? (
          !isMinimized && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 dark:bg-[#25282c] flex items-center justify-center mb-2 sm:mb-3">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500 dark:text-[#6b7280]" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#9ca3af] mb-1">
                No conversations yet
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-[#6b7280] mb-3 sm:mb-4">
                Create a channel or start a direct message
              </p>
              <button
                onClick={onCreateChannel}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm rounded-lg font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>New Channel</span>
              </button>
            </div>
          )
        ) : (
          <div className="py-1 sm:py-2">
            {filteredChannels.starred.length > 0 && (
              <div className="pb-1 sm:pb-2">
                <SectionHeader
                  title="Starred"
                  section="starred"
                  count={filteredChannels.starred.length}
                />
                {expandedSections.has('starred') && (
                  <div className="px-1.5 sm:px-2 space-y-0.5">
                    {filteredChannels.starred.map((channel) => (
                      <ChannelItem key={channel.id} channel={channel} showType />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pb-1 sm:pb-2">
              <SectionHeader
                title="Channels"
                section="channels"
                count={filteredChannels.projectChannels.length}
                unreadCount={totalUnread.channels}
                onAdd={!isMinimized ? onCreateChannel : undefined}
              />
              {expandedSections.has('channels') && (
                <div className="px-1.5 sm:px-2 space-y-0.5">
                  {filteredChannels.projectChannels.length > 0
                    ? filteredChannels.projectChannels.map((channel) => (
                        <ChannelItem key={channel.id} channel={channel} />
                      ))
                    : !isMinimized && (
                        <p className="px-2 py-2 sm:py-3 text-[10px] sm:text-xs text-gray-500 dark:text-[#6b7280] text-center">
                          {searchQuery ? 'No channels found' : 'No channels yet'}
                        </p>
                      )}

                  {!searchQuery && !isMinimized && (
                    <button
                      onClick={onCreateChannel}
                      className="w-full flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#25282c] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Add Channel</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pb-1 sm:pb-2">
              <SectionHeader
                title="Direct Messages"
                section="direct"
                count={filteredChannels.directMessages.length}
                unreadCount={totalUnread.dms}
                onAdd={!isMinimized ? onCreateDM : undefined}
              />
              {expandedSections.has('direct') && (
                <div className="px-1.5 sm:px-2 space-y-0.5">
                  {filteredChannels.directMessages.length > 0
                    ? filteredChannels.directMessages.map((channel) => (
                        <ChannelItem key={channel.id} channel={channel} />
                      ))
                    : !isMinimized && (
                        <p className="px-2 py-2 sm:py-3 text-[10px] sm:text-xs text-gray-500 dark:text-[#6b7280] text-center">
                          {searchQuery ? 'No conversations found' : 'No messages yet'}
                        </p>
                      )}

                  {!searchQuery && !isMinimized && (
                    <button
                      onClick={onCreateDM}
                      className="w-full flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#25282c] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>New Message</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 w-44 sm:w-48 bg-white dark:bg-[#25282c] border border-gray-200 dark:border-[#3a3e43] rounded-xl shadow-xl py-1 overflow-hidden"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 200),
              left: Math.min(contextMenu.x, window.innerWidth - 200),
            }}
          >
            <button
              onClick={() => toggleStar(contextMenu.channelId)}
              className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] transition-colors"
            >
              <Star
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  starredChannels.has(contextMenu.channelId)
                    ? 'text-yellow-500 fill-yellow-500'
                    : ''
                }`}
              />
              <span>
                {starredChannels.has(contextMenu.channelId)
                  ? 'Remove from starred'
                  : 'Add to starred'}
              </span>
            </button>

            <button
              onClick={() => {
                setContextMenu(null);
                toast.success('Mute feature coming soon');
              }}
              className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] transition-colors"
            >
              <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Mute conversation</span>
            </button>

            <div className="h-px bg-gray-200 dark:bg-[#3a3e43] my-1" />

            <button
              onClick={() => {
                setContextMenu(null);
                toast.success('Channel settings coming soon');
              }}
              className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] transition-colors"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Settings</span>
            </button>

            {(() => {
              const channel = channels.find((c) => c.id === contextMenu.channelId);
              if (!channel) return null;
              if (!canDeleteChannel(channel, currentUserId)) return null;

              return (
                <>
                  <div className="h-px bg-gray-200 dark:bg-[#3a3e43] my-1" />
                  <button
                    onClick={() => handleDeleteChannel(contextMenu.channelId)}
                    className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Delete channel</span>
                  </button>
                </>
              );
            })()}

            {(() => {
              const channel = channels.find((c) => c.id === contextMenu.channelId);
              if (!channel) return null;
              if (!canLeaveChannel(channel)) return null;

              const isGroup = isGroupDMChannel(channel);

              return (
                <button
                  onClick={() => handleLeaveChannel(contextMenu.channelId)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{isGroup ? 'Leave conversation' : 'Leave channel'}</span>
                </button>
              );
            })()}
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#25282c] rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-[#3a3e43]">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {confirmModal.type === 'leave' ? 'Leave Channel' : 'Delete Channel'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-[#9ca3af] mb-4 sm:mb-6">
              {confirmModal.type === 'leave'
                ? `Are you sure you want to leave "${confirmModal.channelName}"? You'll need to be re-added to access it again.`
                : `Are you sure you want to delete "${confirmModal.channelName}"? This action cannot be undone and all messages will be lost.`}
            </p>
            <div className="flex gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={deleteChannel.isPending || leaveChannelMutation.isPending}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
              >
                {deleteChannel.isPending || leaveChannelMutation.isPending
                  ? 'Processing...'
                  : confirmModal.type === 'leave'
                    ? 'Leave'
                    : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
