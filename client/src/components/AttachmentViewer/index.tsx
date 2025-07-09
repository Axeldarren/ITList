import React from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

type Props = {
    fileURL: string;
    fileName: string | null | undefined;
    onClose: () => void;
};

const AttachmentViewer = ({ fileURL, fileName, onClose }: Props) => {
    // These checks remain the same and are correct.
    const isImage = /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(fileName || '');
    const isPDF = /\.(pdf)$/i.test(fileName || '');

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 p-4"
            onClick={onClose}
        >
            <div 
                className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white dark:bg-dark-secondary"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-stroke-dark">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{fileName || 'Attachment Viewer'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-auto p-4">
                    {/* --- FIX: Use the fileURL directly --- */}
                    {isImage ? (
                        <Image src={fileURL} alt={fileName || 'Attachment'} className="mx-auto h-auto max-w-full" />
                    ) : isPDF ? (
                        <iframe src={fileURL} className="h-full w-full" title={fileName || 'PDF Viewer'}></iframe>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <p className="text-lg text-gray-700 dark:text-gray-300">Preview is not available for this file type.</p>
                            <a 
                                href={fileURL}
                                download={fileName || 'download'}
                                className="mt-4 rounded-md bg-blue-primary px-4 py-2 text-white hover:bg-blue-600"
                            >
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttachmentViewer;