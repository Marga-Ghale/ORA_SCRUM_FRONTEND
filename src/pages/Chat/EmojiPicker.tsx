// src/pages/chat/EmojiPicker.tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
}

const EMOJI_CATEGORIES = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😝',
    '🤑',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '🤐',
    '🤨',
    '😐',
    '😑',
    '😶',
    '😏',
    '😒',
    '🙄',
    '😬',
    '😮‍💨',
    '🤥',
  ],
  Gestures: [
    '👍',
    '👎',
    '👊',
    '✊',
    '🤛',
    '🤜',
    '🤞',
    '✌️',
    '🤟',
    '🤘',
    '👌',
    '🤌',
    '🤏',
    '👈',
    '👉',
    '👆',
    '👇',
    '☝️',
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👏',
    '🙌',
    '👐',
    '🤲',
    '🤝',
    '🙏',
  ],
  Hearts: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
  ],
  Objects: [
    '🎉',
    '🎊',
    '🎁',
    '🎈',
    '🏆',
    '🥇',
    '🥈',
    '🥉',
    '⭐',
    '🌟',
    '✨',
    '💫',
    '🔥',
    '💯',
    '✅',
    '❌',
    '⚡',
    '💡',
    '🔔',
    '🎵',
    '🎶',
  ],
  Nature: [
    '🌸',
    '🌺',
    '🌻',
    '🌹',
    '🌷',
    '🌼',
    '🌱',
    '🌲',
    '🌳',
    '🌴',
    '🌵',
    '🍀',
    '🍁',
    '🍂',
    '🍃',
    '🌈',
    '☀️',
    '🌙',
    '⭐',
    '🌊',
  ],
  Food: [
    '🍕',
    '🍔',
    '🍟',
    '🌭',
    '🍿',
    '🧂',
    '🥗',
    '🍜',
    '🍝',
    '🍣',
    '🍱',
    '🍩',
    '🍪',
    '🎂',
    '🍰',
    '☕',
    '🍵',
    '🥤',
    '🍺',
    '🍷',
  ],
  Animals: [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🦄',
  ],
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  position = { bottom: 40, right: 0 },
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Smileys');

  if (!isOpen) return null;

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  // Filter emojis by search
  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES)
        .flat()
        .filter((emoji) => emoji.includes(searchQuery))
    : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Picker */}
      <div
        className="absolute z-50 w-[320px] bg-white dark:bg-[#25282c] border border-gray-200 dark:border-[#3a3e43] rounded-xl shadow-2xl overflow-hidden"
        style={position}
      >
        {/* Search */}
        <div className="p-2 border-b border-gray-200 dark:border-[#3a3e43]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emoji..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#1a1d21] border border-gray-200 dark:border-[#3a3e43] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#6b7280] text-sm focus:outline-none focus:border-brand-500/50"
            />
          </div>
        </div>

        {/* Categories */}
        {!searchQuery && (
          <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-[#3a3e43] overflow-x-auto custom-scrollbar">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#3a3e43]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Emojis Grid */}
        <div className="p-2 max-h-[200px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-[#3a3e43] rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-[#6b7280] py-4">
              No emojis found
            </p>
          )}
        </div>
      </div>
    </>
  );
};
