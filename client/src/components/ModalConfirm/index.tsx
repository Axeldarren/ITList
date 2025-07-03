import React from 'react';
import Modal from '@/components/Modal'; // We'll reuse your existing Modal wrapper

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
};

const ModalConfirm = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false
}: Props) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} name={title}>
        <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                {message}
            </p>
            <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-dark-tertiary dark:bg-dark-secondary dark:text-white dark:hover:bg-dark-tertiary"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default ModalConfirm;