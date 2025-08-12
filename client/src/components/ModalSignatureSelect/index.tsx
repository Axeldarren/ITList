import React, { useState } from 'react';
import { User } from '@/state/api';
import Modal from '@/components/Modal';
import { PenTool } from 'lucide-react';
import Image from 'next/image';

interface SignatureInfo {
    user: User;
    role: 'IT Department Head' | 'IT Supervisor';
}

interface ModalSignatureSelectProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (signatures: SignatureInfo[]) => void;
    users: User[];
}

const ModalSignatureSelect: React.FC<ModalSignatureSelectProps> = ({
    isOpen,
    onClose,
    onConfirm,
    users
}) => {
    const [selectedDepartmentHead, setSelectedDepartmentHead] = useState<User | null>(null);
    const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null);

    const handleConfirm = () => {
        const signatures: SignatureInfo[] = [];
        
        if (selectedSupervisor) {
            signatures.push({
                user: selectedSupervisor,
                role: 'IT Supervisor'
            });
        }
        
        if (selectedDepartmentHead) {
            signatures.push({
                user: selectedDepartmentHead,
                role: 'IT Department Head'
            });
        }

        onConfirm(signatures);
        onClose();
    };

    const handleClose = () => {
        setSelectedDepartmentHead(null);
        setSelectedSupervisor(null);
        onClose();
    };

    const renderUserOption = (user: User, isSelected: boolean, onSelect: () => void) => (
        <div
            key={user.userId}
            onClick={onSelect}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
        >
            {user.profilePictureUrl ? (
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${user.profilePictureUrl}`}
                    alt={user.username || 'User'}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg"
                />
            ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                    {user.username?.substring(0, 2).toUpperCase() || 'U'}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                </p>
            </div>
            {isSelected && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} name="Select Report Signatories">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <PenTool size={20} />
                    <p className="text-sm">
                        Select users to include as signatories on the project report. Their names and roles will appear in the signature section.
                    </p>
                </div>

                {/* IT Supervisor */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        IT Supervisor
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        <div
                            onClick={() => setSelectedSupervisor(null)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                !selectedSupervisor 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
                                <span className="text-gray-600 dark:text-gray-300 text-xs">None</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    No Supervisor
                                </p>
                            </div>
                            {!selectedSupervisor && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        {users.map(user => 
                            renderUserOption(
                                user, 
                                selectedSupervisor?.userId === user.userId,
                                () => setSelectedSupervisor(user)
                            )
                        )}
                    </div>
                </div>

                {/* IT Department Head */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        IT Department Head
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        <div
                            onClick={() => setSelectedDepartmentHead(null)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                !selectedDepartmentHead 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
                                <span className="text-gray-600 dark:text-gray-300 text-xs">None</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    No Department Head
                                </p>
                            </div>
                            {!selectedDepartmentHead && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        {users.map(user => 
                            renderUserOption(
                                user, 
                                selectedDepartmentHead?.userId === user.userId,
                                () => setSelectedDepartmentHead(user)
                            )
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Generate Report
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalSignatureSelect;
