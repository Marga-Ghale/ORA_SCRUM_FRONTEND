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
} from 'lucide-react';
import { ChatChannel, getChannelDisplayName } from '../../hooks/api/useChat';

interface ChannelListProps {
  channels: ChatChannel[];
  activeChannelId?: string;
  unreadCounts: Record<string, number>;
  onSelectChannel: (channel: ChatChannel) => void;
  onCreateChannel: () => void;
  onCreateDM: () => void;
  isLoading?: boolean;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  unreadCounts,
  onSelectChannel,
  onCreateChannel,
  onCreateDM,
  isLoading = false,
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

  // Categorize channels
  const categorizedChannels = useMemo(() => {
    const starred: ChatChannel[] = [];
    const projectChannels: ChatChannel[] = [];
    const directMessages: ChatChannel[] = [];

    channels.forEach((channel) => {
      if (starredChannels.has(channel.id)) {
        starred.push(channel);
      }
      if (channel.type === 'direct') {
        directMessages.push(channel);
      } else {
        projectChannels.push(channel);
      }
    });

    return { starred, projectChannels, directMessages };
  }, [channels, starredChannels]);

  // Filter by search
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return categorizedChannels;

    const query = searchQuery.toLowerCase();
    const filterChannel = (channel: ChatChannel) => {
      const name = (getChannelDisplayName(channel) || '').toLowerCase();
      return name.includes(query);
    };

    return {
      starred: categorizedChannels.starred.filter(filterChannel),
      projectChannels: categorizedChannels.projectChannels.filter(filterChannel),
      directMessages: categorizedChannels.directMessages.filter(filterChannel),
    };
  }, [categorizedChannels, searchQuery]);

  // Calculate total unread counts
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
    const displayName = getChannelDisplayName(channel) || 'Unknown';
    const isStarred = starredChannels.has(channel.id);
    const isDM = channel.type === 'direct';

    return (
      <button
        onClick={() => onSelectChannel(channel)}
        onContextMenu={(e) => handleContextMenu(e, channel.id)}
        onMouseEnter={() => setHoveredChannel(channel.id)}
        onMouseLeave={() => setHoveredChannel(null)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all group relative
          ${
            isActive
              ? 'bg-brand-500/20 text-brand-400'
              : unread > 0
              ? 'text-white hover:bg-[#25282c]'
              : 'text-[#9ca3af] hover:bg-[#25282c] hover:text-white'
          }`}
      >
        {/* Channel Icon / Avatar */}
        {isDM ? (
          <div className="relative flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-[10px] font-medium text-white">
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
            {/* Online status */}
            <Circle
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 stroke-[#1a1d21] stroke-2 ${
                channel.otherUser?.status === 'online'
                  ? 'text-green-500 fill-green-500'
                  : 'text-gray-500 fill-gray-500'
              }`}
            />
          </div>
        ) : (
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
              isActive ? 'bg-brand-500/30' : 'bg-[#2a2e33]'
            }`}
          >
            <Hash
              className={`w-3.5 h-3.5 ${
                isActive ? 'text-brand-400' : 'text-[#6b7280]'
              }`}
            />
          </div>
        )}

        {/* Channel Name */}
        <span
          className={`flex-1 truncate text-left ${
            unread > 0 ? 'font-semibold' : ''
          }`}
        >
          {displayName}
        </span>

        {/* Type Badge (for starred section) */}
        {showType && (
          <span className="text-[10px] text-[#6b7280] uppercase">
            {isDM ? 'DM' : channel.type}
          </span>
        )}

        {/* Private Lock */}
        {channel.isPrivate && !isDM && (
          <Lock className="w-3 h-3 text-[#6b7280] flex-shrink-0" />
        )}

        {/* Starred Indicator */}
        {isStarred && !showType && (
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
        )}

        {/* Unread Badge */}
        {unread > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center flex-shrink-0">
            {unread > 99 ? '99+' : unread}
          </span>
        )}

        {/* Hover Actions */}
        {isHovered && !unread && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, channel.id);
            }}
            className="p-0.5 rounded hover:bg-[#3a3e43] text-[#6b7280] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </button>
    );
  };

  // Section Header Component
  const SectionHeader: React.FC<{
    title: string;
    section: string;
    count: number;
    unreadCount?: number;
    onAdd?: () => void;
  }> = ({ title, section, count, unreadCount = 0, onAdd }) => {
    const isExpanded = expandedSections.has(section);

    return (
      <div className="flex items-center gap-1 px-2 py-1.5 group">
        <button
          onClick={() => toggleSection(section)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hover:text-[#9ca3af] transition-colors"
        >
          <ChevronRight
            className={`w-3 h-3 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <span>{title}</span>
        </button>

        <span className="text-[10px] text-[#6b7280] px-1.5 py-0.5 bg-[#25282c] rounded ml-1">
          {count}
        </span>

        {unreadCount > 0 && (
          <span className="text-[10px] font-bold text-red-400 ml-auto mr-1">
            {unreadCount} new
          </span>
        )}

        {onAdd && (
          <button
            onClick={onAdd}
            className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white opacity-0 group-hover:opacity-100 transition-all ml-auto"
            title={`Add ${title.toLowerCase()}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="p-2 space-y-1">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2 py-1.5 animate-pulse"
        >
          <div className="w-6 h-6 rounded-md bg-[#2a2e33]" />
          <div
            className="h-4 bg-[#2a2e33] rounded flex-1"
            style={{ width: `${Math.random() * 40 + 40}%` }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#1a1d21] border-r border-[#2a2e33]">
      {/* Header */}
      <div className="p-3 border-b border-[#2a2e33]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">Messages</h2>
          </div>
          <button
            onClick={onCreateChannel}
            className="p-1.5 rounded-lg hover:bg-[#2a2e33] text-[#9ca3af] hover:text-white transition-colors"
            title="Create channel"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#25282c] border border-[#2a2e33] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-brand-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#3a3e43] text-[#6b7280] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <LoadingSkeleton />
        ) : channels.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-[#25282c] flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-[#6b7280]" />
            </div>
            <p className="text-sm text-[#9ca3af] mb-1">No conversations yet</p>
            <p className="text-xs text-[#6b7280] mb-4">
              Create a channel or start a direct message
            </p>
            <button
              onClick={onCreateChannel}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Channel</span>
            </button>
          </div>
        ) : (
          <>
            {/* Starred Section */}
            {filteredChannels.starred.length > 0 && (
              <div className="py-2">
                <SectionHeader
                  title="Starred"
                  section="starred"
                  count={filteredChannels.starred.length}
                />
                {expandedSections.has('starred') && (
                  <div className="px-2 space-y-0.5">
                    {filteredChannels.starred.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        showType
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Channels Section */}
            <div className="py-2">
              <SectionHeader
                title="Channels"
                section="channels"
                count={filteredChannels.projectChannels.length}
                unreadCount={totalUnread.channels}
                onAdd={onCreateChannel}
              />
              {expandedSections.has('channels') && (
                <div className="px-2 space-y-0.5">
                  {filteredChannels.projectChannels.length > 0 ? (
                    filteredChannels.projectChannels.map((channel) => (
                      <ChannelItem key={channel.id} channel={channel} />
                    ))
                  ) : (
                    <p className="px-2 py-3 text-xs text-[#6b7280] text-center">
                      {searchQuery ? 'No channels found' : 'No channels yet'}
                    </p>
                  )}

                  {/* Add Channel Button */}
                  {!searchQuery && (
                    <button
                      onClick={onCreateChannel}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[#6b7280] hover:text-white hover:bg-[#25282c] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Channel</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Direct Messages Section */}
            <div className="py-2">
              <SectionHeader
                title="Direct Messages"
                section="direct"
                count={filteredChannels.directMessages.length}
                unreadCount={totalUnread.dms}
                onAdd={onCreateDM}
              />
              {expandedSections.has('direct') && (
                <div className="px-2 space-y-0.5">
                  {filteredChannels.directMessages.length > 0 ? (
                    filteredChannels.directMessages.map((channel) => (
                      <ChannelItem key={channel.id} channel={channel} />
                    ))
                  ) : (
                    <p className="px-2 py-3 text-xs text-[#6b7280] text-center">
                      {searchQuery ? 'No conversations found' : 'No messages yet'}
                    </p>
                  )}

                  {/* New Message Button */}
                  {!searchQuery && (
                    <button
                      onClick={onCreateDM}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[#6b7280] hover:text-white hover:bg-[#25282c] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Message</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 w-48 bg-[#25282c] border border-[#3a3e43] rounded-xl shadow-xl py-1 overflow-hidden"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 200),
              left: Math.min(contextMenu.x, window.innerWidth - 200),
            }}
          >
            <button
              onClick={() => toggleStar(contextMenu.channelId)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#3a3e43] transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
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

            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#3a3e43] transition-colors">
              <BellOff className="w-4 h-4" />
              <span>Mute conversation</span>
            </button>

            <div className="h-px bg-[#3a3e43] my-1" />

            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#3a3e43] transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#3a3e43] transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Leave channel</span>
            </button>

            <div className="h-px bg-[#3a3e43] my-1" />

            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};