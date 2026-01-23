// src/components/members/MemberActionModal.tsx
import { useState } from 'react';
import { X, UserPlus, UserMinus, Shield, AlertCircle, Loader2 } from 'lucide-react';

export type MemberActionType = 'add' | 'remove' | 'updateRole';

interface MemberActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: MemberActionType;
  entityType: 'workspace' | 'space' | 'folder' | 'project';
  memberName?: string;
  currentRole?: string;
  newRole?: string;
  memberCount?: number;
  onConfirm: () => Promise<void>;
}

const actionConfig = {
  add: {
    icon: UserPlus,
    title: 'Add Members',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    buttonColor: 'bg-green-600 hover:bg-green-700',
  },
  remove: {
    icon: UserMinus,
    title: 'Remove Member',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  updateRole: {
    icon: Shield,
    title: 'Update Role',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
};

export const MemberActionModal = ({
  isOpen,
  onClose,
  actionType,
  entityType,
  memberName,
  currentRole,
  newRole,
  memberCount = 1,
  onConfirm,
}: MemberActionModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const config = actionConfig[actionType];
  const Icon = config.icon;

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDescription = () => {
    switch (actionType) {
      case 'add':
        return (
          <div className="space-y-2">
            <p className="text-sm text-[#e5e7eb]">
              You are about to add{' '}
              <span className="font-semibold text-white">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>{' '}
              to this {entityType}.
            </p>
            {newRole && (
              <p className="text-xs text-[#9ca3af]">
                Role: <span className="font-medium capitalize text-[#a78bfa]">{newRole}</span>
              </p>
            )}
          </div>
        );

      case 'remove':
        return (
          <div className="space-y-2">
            <p className="text-sm text-[#e5e7eb]">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-white">{memberName}</span> from this {entityType}?
            </p>
            <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90">
                This will revoke their access to this {entityType} and all its contents.
              </p>
            </div>
          </div>
        );

      case 'updateRole':
        return (
          <div className="space-y-2.5">
            <p className="text-sm text-[#e5e7eb]">
              Update role for <span className="font-semibold text-white">{memberName}</span>
            </p>
            <div className="flex items-center gap-3 p-3 bg-[#25282c] rounded-lg border border-[#2a2e33]">
              <div className="flex-1">
                <p className="text-[11px] text-[#6b7280] mb-0.5">Current Role</p>
                <p className="text-sm font-medium capitalize text-white">{currentRole}</p>
              </div>
              <div className="text-[#6b7280]">→</div>
              <div className="flex-1">
                <p className="text-[11px] text-[#6b7280] mb-0.5">New Role</p>
                <p className="text-sm font-medium capitalize text-[#a78bfa]">{newRole}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1a1d21] border border-[#2a2e33] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#2a2e33]">
          <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <h2 className="text-base font-semibold text-white flex-1">{config.title}</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md hover:bg-[#25282c] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-[#6b7280] hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">{getDescription()}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[#25282c]/50 border-t border-[#2a2e33]">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-medium text-[#9ca3af] bg-[#25282c] border border-[#2a2e33] rounded-md hover:bg-[#2a2e33] hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5 ${config.buttonColor}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing modal state
export const useMemberActionModal = () => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: MemberActionType;
    memberName?: string;
    currentRole?: string;
    newRole?: string;
    memberCount?: number;
    onConfirm?: () => Promise<void>;
  }>({
    isOpen: false,
    actionType: 'add',
  });

  const openModal = (
    actionType: MemberActionType,
    options: {
      memberName?: string;
      currentRole?: string;
      newRole?: string;
      memberCount?: number;
      onConfirm: () => Promise<void>;
    }
  ) => {
    setModalState({
      isOpen: true,
      actionType,
      ...options,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return { modalState, openModal, closeModal };
};
