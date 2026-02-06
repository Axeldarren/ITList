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
    const [role, setRole] = useState('DEVELOPER');
    const [department, setDepartment] = useState('');
    const departmentOptions = [
        'SUPPORT',
        'NETWORK / INFRA',
        'DEV MOBILE (NON CORE)',
        'Develop (Core)',
        'SYSADMIN & DBA',
        'BUSSINESS, ANALYST & REPORTING',
        'User',
    ];

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
            setNIK(String(user.NIK || ''));
            setRole(user.role || 'DEVELOPER');
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
            role,
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
    <Modal isOpen={isOpen} onClose={onClose} name={`Edit User: ${user?.username}`} closeOnBackdropClick={false}>
            <form
                className='mt-4 space-y-4'
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
                <input type='text' className={inputStyles} placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type='email' className={inputStyles} placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type='number' className={inputStyles} placeholder='NIK' value={NIK} onChange={(e) => setNIK(e.target.value)} required />
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
                <select
                    className={inputStyles}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="DEVELOPER">Developer</option>
                    <option value="ADMIN">Admin</option>
                    <option value="BUSINESS_OWNER">Business Owner</option>
                </select>
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