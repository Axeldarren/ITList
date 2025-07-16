"use client";

import React, { useState } from 'react';
import { useLoginMutation } from '@/state/api';
import { useAppDispatch } from '@/app/redux';
import { setCredentials } from '@/state/authSlice';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('alice.jones@example.com');
    const [password, setPassword] = useState('password123');
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [login, { isLoading }] = useLoginMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Call the login API endpoint
            const { data, token } = await login({ email, password }).unwrap();
            
            // Store the token and user data in the Redux store
            dispatch(setCredentials({ user: data.user, token }));
            
            toast.success('Login successful!');
            router.push('/home'); // Redirect to the dashboard
        } catch (err: unknown) {
            const error = err as { data?: { message?: string } };
            toast.error(error.data?.message || 'Failed to login. Please check your credentials.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-dark-secondary">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                    ITList Login
                </h1>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder='Enter your email'
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-tertiary dark:border-dark-tertiary dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder='Enter your password'
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-tertiary dark:border-dark-tertiary dark:text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-white bg-blue-primary rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
