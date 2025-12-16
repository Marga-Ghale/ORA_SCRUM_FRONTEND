// ============================================
// Empty State Component
// ============================================

import { MessageSquare, Plus } from 'lucide-react';

export const EmptyChatState: React.FC<{ onCreateChannel: () => void }> = ({ onCreateChannel }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#0d0f11]">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 flex items-center justify-center mb-6">
      <MessageSquare className="w-10 h-10 text-brand-400" />
    </div>
    <h2 className="text-2xl font-semibold text-white mb-2">Welcome to Chat</h2>
    <p className="text-[#6b7280] max-w-md mb-6">
      Start a conversation with your team. Create channels for projects, teams, or direct message
      your colleagues.
    </p>
    <button
      onClick={onCreateChannel}
      className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
    >
      <Plus className="w-5 h-5" />
      <span>Start a Conversation</span>
    </button>
  </div>
);
