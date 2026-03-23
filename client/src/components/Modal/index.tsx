import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

type Props = {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    name: string;
    closeOnBackdropClick?: boolean;
    className?: string;
    wrapperClassName?: string;
}

const Modal = ({
    children,
    isOpen,
    onClose,
    name,
    closeOnBackdropClick = false,
    className,
    wrapperClassName,
}: Props) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
        className={wrapperClassName || 'fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-black/50 p-4'}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
            if (!closeOnBackdropClick) return;
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}
    >
        <div
            className={className || 'relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-dark-secondary ring-1 ring-black/5 dark:ring-white/10'}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-tertiary">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{name}</h2>
                <button
                    className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300 transition-colors"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={16} />
                </button>
            </div>
            {/* Content */}
            <div className="px-6 py-5">
                {children}
            </div>
        </div>
    </div>,
    document.body,
  );
};

export default Modal;