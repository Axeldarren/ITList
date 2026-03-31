"use client";

import Modal from '@/components/Modal';
import { useCreateUserMutation } from '@/state/api';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const inputStyles = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-dark-tertiary dark:bg-dark-bg dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:bg-dark-bg transition-colors";
const labelStyles = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const departmentOptions = [
    'SUPPORT', 'NETWORK / INFRA', 'DEV MOBILE (NON CORE)',
    'Develop (Core)', 'SYSADMIN & DBA', 'BUSSINESS, ANALYST & REPORTING', 'User',
];

const ModalNewUser = ({ isOpen, onClose }: Props) => {
    const [createUser, { isLoading }] = useCreateUserMutation();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [NIK, setNIK] = useState('');
    const [role, setRole] = useState('DEVELOPER');
    const [department, setDepartment] = useState('');

    const resetForm = () => {
        setUsername(''); setEmail(''); setPassword('');
        setNIK(''); setRole('DEVELOPER'); setDepartment('');
    };

    const handleSubmit = async () => {
        if (!username || !email || !password) {
            toast.error("Username, email, and password are required.");
            return;
        }

        const promise = createUser({ username, email, password, NIK: NIK ? Number(NIK) : undefined, role, department: department || undefined }).unwrap();

        toast.promise(promise, {
            loading: 'Creating user...',
            success: (data) => { resetForm(); onClose(); return `User "${data.username}" created successfully!`; },
            error: (err) => err.data?.message || 'Failed to create user.'
        });
    };

    const isFormValid = () => username && email && password && NIK;

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Add New User" closeOnBackdropClick={false}>
            <form className='space-y-4' onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelStyles}>Username <span className="text-red-400">*</span></label>
                        <input type='text' className={inputStyles} placeholder='e.g. john_doe' value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div>
                        <label className={labelStyles}>NIK <span className="text-red-400">*</span></label>
                        <input type='number' className={inputStyles} placeholder='Employee ID' value={NIK} onChange={(e) => setNIK(e.target.value)} required />
                    </div>
                </div>

                <div>
                    <label className={labelStyles}>Email <span className="text-red-400">*</span></label>
                    <input type='email' className={inputStyles} placeholder='email@company.com' value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div>
                    <label className={labelStyles}>Password <span className="text-red-400">*</span></label>
                    <input type='password' className={inputStyles} placeholder='Set a password' value={password} onChange={(e) => setPassword(e.target.value)} required />
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
                    disabled={!isFormValid() || isLoading}
                >
                    {isLoading ? 'Creating…' : 'Create User'}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewUser;