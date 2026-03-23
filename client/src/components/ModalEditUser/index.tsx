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

const inputStyles = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-dark-tertiary dark:bg-dark-bg dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-500 transition-colors";
const labelStyles = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const departmentOptions = [
    'SUPPORT', 'NETWORK / INFRA', 'DEV MOBILE (NON CORE)',
    'Develop (Core)', 'SYSADMIN & DBA', 'BUSSINESS, ANALYST & REPORTING', 'User',
];

const ModalEditUser = ({ isOpen, onClose, user }: Props) => {
    const [updateUser, { isLoading }] = useUpdateUserMutation();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [NIK, setNIK] = useState('');
    const [role, setRole] = useState('DEVELOPER');
    const [department, setDepartment] = useState('');

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
            username, email,
            NIK: NIK ? Number(NIK) : undefined,
            role,
            department: department || undefined,
        }).unwrap();

        toast.promise(promise, {
            loading: 'Updating user...',
            success: (data) => { onClose(); return `User "${data.username}" updated!`; },
            error: (err) => err.data?.message || 'Failed to update user.'
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} name={`Edit User: ${user?.username ?? ''}`} closeOnBackdropClick={false}>
            <form className='space-y-4' onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelStyles}>Username</label>
                        <input type='text' className={inputStyles} placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div>
                        <label className={labelStyles}>NIK</label>
                        <input type='number' className={inputStyles} placeholder='Employee ID' value={NIK} onChange={(e) => setNIK(e.target.value)} required />
                    </div>
                </div>

                <div>
                    <label className={labelStyles}>Email</label>
                    <input type='email' className={inputStyles} placeholder='email@company.com' value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelStyles}>Role</label>
                        <select className={inputStyles} value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="DEVELOPER">Developer</option>
                            <option value="ADMIN">Admin</option>
                            <option value="BUSINESS_OWNER">Business Owner</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyles}>Department</label>
                        <select className={inputStyles} value={department} onChange={(e) => setDepartment(e.target.value)}>
                            <option value="">— Optional —</option>
                            {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    type='submit'
                    className="w-full rounded-lg bg-blue-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving…' : 'Save Changes'}
                </button>
            </form>
        </Modal>
    );
};

export default ModalEditUser;