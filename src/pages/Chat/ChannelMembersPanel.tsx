// src/pages/chat/ChannelMembersPanel.tsx
import React, { useState } from 'react';
import { X, Search, UserPlus, MoreHorizontal, Crown,  Circle } from 'lucide-react';
import { useChannelMembers, ChatChannel, ChatChannelMember } from '../../hooks/api/useChat';

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
  const { data: members = [], isLoading } = useChannelMembers(channel?.id);

  // Filter members
  const filteredMembers = searchQuery
    ? members.filter((m) =>
        m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  // Separate online and offline
  const onlineMembers = filteredMembers.filter((m) => m.user?.status === 'online');
  const offlineMembers = filteredMembers.filter((m) => m.user?.status !== 'online');

  if (!isOpen) return null;

  const MemberItem: React.FC<{ member: ChatChannelMember }> = ({ member }) => {
    const isOwner = member.userId === channel.createdBy;
    const isCurrentUser = member.userId === currentUserId;
    const userName = member.user?.name || 'Unknown';
    const isOnline = member.user?.status === 'online';

    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#25282c] group">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
            {member.user?.avatar ? (
              <img
                src={member.user.avatar}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userName[0]?.toUpperCase()
            )}
          </div>
          {/* Status indicator */}
          <Circle
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${
              isOnline ? 'text-green-500 fill-green-500' : 'text-gray-500 fill-gray-500'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{userName}</span>
            {isOwner && (
              <Crown className="w-3.5 h-3.5 text-yellow-500" title="Channel Owner" />
            )}
            {isCurrentUser && (
              <span className="text-xs text-[#6b7280]">(you)</span>
            )}
          </div>
          <p className="text-xs text-[#6b7280] truncate">{member.user?.email}</p>
        </div>

        {/* Actions */}
        <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#3a3e43] text-[#6b7280] hover:text-white transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-[280px] h-full flex flex-col bg-[#1a1d21] border-l border-[#2a2e33]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e33]">
        <h3 className="text-sm font-semibold text-white">
          Members ({members.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#2a2e33] rounded-lg text-[#6b7280] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#2a2e33]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find members..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#25282c] border border-[#2a2e33] rounded-lg text-white placeholder-[#6b7280] text-xs focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </div>

      {/* Add Members Button */}
      {!channel.isPrivate && (
        <div className="p-3 border-b border-[#2a2e33]">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg text-sm font-medium transition-colors">
            <UserPlus className="w-4 h-4" />
            <span>Add People</span>
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoading ? (
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