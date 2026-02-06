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

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setNIK('');
    setRole('DEVELOPER');
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
            role,
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

    const isFormValid = () => username && email && password && NIK;

    const inputStyles = "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

    return (
    <Modal isOpen={isOpen} onClose={onClose} name="Add New User" closeOnBackdropClick={false}>
            <form
                className='mt-4 space-y-4'
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
                <input type='text' className={inputStyles} placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type='email' className={inputStyles} placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type='password' className={inputStyles} placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} required />
                <input type='number' className={inputStyles} placeholder='NIK' value={NIK} onChange={(e) => setNIK(e.target.value)} required />
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
                    disabled={!isFormValid() || isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewUser;