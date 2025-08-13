"use client";

import Modal from '@/components/Modal';
import { useUpdateUserMutation, User } from '@/state/api';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
};

const ModalEditUser = ({ isOpen, onClose, user }: Props) => {
    const [updateUser, { isLoading }] = useUpdateUserMutation();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [NIK, setNIK] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [department, setDepartment] = useState('');
    const departmentOptions = [
        'SUPPORT',
        'NETWORK / INFRA',
        'DEV MOBILE (NON CORE)',
        'SYSADMIN & DBA',
        'BUSSINESS, ANALYST & REPORTING',
    ];

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
            setNIK(String(user.NIK || ''));
            setIsAdmin(user.isAdmin || false);
            setDepartment(user.department || '');
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!user) return;

        const promise = updateUser({
            userId: user.userId!,
            username,
            email,
            NIK: NIK ? Number(NIK) : undefined,
            isAdmin,
            department: department || undefined,
        }).unwrap();

        toast.promise(promise, {
            loading: 'Updating user...',
            success: (data) => {
                onClose();
                return `User "${data.username}" updated successfully!`;
            },
            error: (err) => err.data?.message || 'Failed to update user.'
        });
    };

    const inputStyles = "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

    return (
        <Modal isOpen={isOpen} onClose={onClose} name={`Edit User: ${user?.username}`}>
            <form
                className='mt-4 space-y-4'
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
                <input type='text' className={inputStyles} placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type='email' className={inputStyles} placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type='number' className={inputStyles} placeholder='NIK' value={NIK} onChange={(e) => setNIK(e.target.value)} />
                <select
                    className={inputStyles}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                >
                    <option value="">Select Department</option>
                    {departmentOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                
                <div className="flex items-center">
                    <input
                        id="isAdminEdit"
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-primary focus:ring-blue-500"
                    />
                    <label htmlFor="isAdminEdit" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        Administrator
                    </label>
                </div>

                <button
                    type='submit'
                    className={`mt-4 flex w-full justify-center rounded-md border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-50`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </Modal>
    );
};

export default ModalEditUser;