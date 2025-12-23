// ============================================
// Message Input Component
// ============================================

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../../hooks/api/useChat';
import { AtSign, Edit2, Paperclip, Send, Smile, X } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  channelName: string;
  onSend: (content: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelName,
  onSend,
  editingMessage,
  onCancelEdit,
  disabled,
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleSubmit = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && editingMessage && onCancelEdit) {
      onCancelEdit();
      setContent('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  return (
    <div className="p-4 border-t border-gray-200 dark:border-[#2a2e33] relative">
      {/* Editing indicator */}
      {editingMessage && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-100 dark:bg-[#25282c] rounded-lg">
          <Edit2 className="w-4 h-4 text-brand-400" />
          <span className="text-sm text-gray-600 dark:text-[#9ca3af]">Editing message</span>
          <button
            onClick={onCancelEdit}
            className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-100 dark:bg-[#25282c] rounded-xl p-2">
        {/* Attachment button */}
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors">
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${channelName}`}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#6b7280] resize-none focus:outline-none text-sm py-2 max-h-[200px]"
        />

        {/* Emoji button */}
        <div className="relative">
          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded-lg transition-colors ${
              showEmojiPicker
                ? 'bg-gray-200 dark:bg-[#3a3e43] text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={handleEmojiSelect}
            position={{ bottom: 50, right: 0 }}
          />
        </div>

        {/* Mention button */}
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors">
          <AtSign className="w-5 h-5" />
        </button>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          className={`p-2 rounded-lg transition-colors ${
            content.trim() && !disabled
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-gray-300 dark:bg-[#3a3e43] text-gray-500 dark:text-[#6b7280] cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500 dark:text-[#6b7280] text-center">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#2a2e33] rounded">Enter</kbd> to
        send,{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#2a2e33] rounded">Shift + Enter</kbd> for
        new line
      </p>
    </div>
  );
};
