"use client";

import Modal from '@/components/Modal';
import { useCreateUserMutation } from '@/state/api';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const ModalNewUser = ({ isOpen, onClose }: Props) => {
    const [createUser, { isLoading }] = useCreateUserMutation();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [NIK, setNIK] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [department, setDepartment] = useState('');
    const departmentOptions = [
        'SUPPORT',
        'NETWORK / INFRA',
        'DEV MOBILE (NON CORE)',
        'Develop (Core)',
        'SYSADMIN & DBA',
        'BUSSINESS, ANALYST & REPORTING',
    ];

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setNIK('');
    setIsAdmin(false);
    setDepartment('');
    };

    const handleSubmit = async () => {
        if (!username || !email || !password) {
            toast.error("Username, email, and password are required.");
            return;
        }

        const promise = createUser({
            username,
            email,
            password,
            NIK: NIK ? Number(NIK) : undefined,
            isAdmin,
            department: department || undefined,
        }).unwrap();

        toast.promise(promise, {
            loading: 'Creating user...',
            success: (data) => {
                resetForm();
                onClose();
                return `User "${data.username}" created successfully!`;
            },
            error: (err) => err.data?.message || 'Failed to create user.'
        });
    };

    const isFormValid = () => username && email && password;

    const inputStyles = "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Add New User">
            <form
                className='mt-4 space-y-4'
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
                <input type='text' className={inputStyles} placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type='email' className={inputStyles} placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type='password' className={inputStyles} placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} required />
                <input type='number' className={inputStyles} placeholder='NIK (Optional)' value={NIK} onChange={(e) => setNIK(e.target.value)} />
                <select
                    className={inputStyles}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                >
                    <option value="">Select Department (Optional)</option>
                    {departmentOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                
                <div className="flex items-center">
                    <input
                        id="isAdmin"
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-primary focus:ring-blue-500"
                    />
                    <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        Make this user an Administrator
                    </label>
                </div>

                <button
                    type='submit'
                    className={`mt-4 flex w-full justify-center rounded-md border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-50`}
                    disabled={!isFormValid() || isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewUser;