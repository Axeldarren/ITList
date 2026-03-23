import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
};

const ModalConfirm = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }: Props) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-dark-secondary ring-1 ring-black/5 dark:ring-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-tertiary">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-dark-tertiary">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-bg dark:text-gray-300 dark:hover:bg-dark-tertiary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModalConfirm;