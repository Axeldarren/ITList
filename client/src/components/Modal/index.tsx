import React from 'react';
import ReactDOM from 'react-dom';
import Header from '../Header';
import { X } from 'lucide-react';

type Props = {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    name: string;
}

const Modal = ({
    children,
    isOpen,
    onClose,
    name
}: Props) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    // --- UPDATED: Changed items-center to items-start and added padding-top ---
    <div className='fixed inset-0 flex h-full w-full items-start justify-center overflow-y-auto bg-gray-600 bg-opacity-50 p-4 pt-24'>
        <div className='w-full max-w-2xl rounded-lg bg-white p-4 shadow-lg dark:bg-dark-secondary'>
            <Header 
                name={name}
                buttonComponent={
                    <button
                        className='flex h-7 w-7 items-center justify-center rounded-full bg-blue-primary text-white hover:bg-blue-600'
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                }
                isSmallText
            />
            {children}
        </div>
    </div>,
    document.body,
  );
};

export default Modal;