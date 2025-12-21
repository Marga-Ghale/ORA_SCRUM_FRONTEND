// src/components/modals/AddSpaceMemberModal.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAddMember } from '../../hooks/api/useMembers';
import { Modal } from '../ui/modal';

interface AddSpaceMemberModalProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AddSpaceMemberModal: React.FC<AddSpaceMemberModalProps> = ({ spaceId, isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const { mutateAsync: addMember, isLoading } = useAddMember({
    entityType: 'space', // Ensure this uses 'space'
    entityId: spaceId,
  });

  const handleAddMember = async () => {
    if (!email) return toast.error('Please enter an email.');
    try {
      await addMember({ email });
      toast.success('Member added successfully!');
      setEmail('');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add member.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-200">Member Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full p-2 rounded-md bg-[#25282c] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMember}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddSpaceMemberModal;
