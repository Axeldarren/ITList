"use client";

import React, { useEffect, useState } from 'react';
import { useLoginMutation } from '@/state/api';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setCredentials } from '@/state/authSlice';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { ButtonSpinner, FullPageLoading } from '@/components/LoadingSpinner';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [login, { isLoading }] = useLoginMutation();
    const token = useAppSelector((s) => s.auth.token);
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

    // Prevent access to login if already authenticated
    useEffect(() => {
        if (token) {
            router.replace('/home');
        }
    }, [token, router]);

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

    // If already logged in, show a small placeholder while redirecting
    if (token) {
        return (
            <>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: isDarkMode ? '#3b3d40' : '#ffffff',
                            color: isDarkMode ? '#ffffff' : '#101214',
                        },
                    }}
                />
               <FullPageLoading text="Redirecting..." />
            </>
        );
    }
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: isDarkMode ? '#3b3d40' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#101214',
                    },
                }}
            />
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-dark-secondary page-fade-in">
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
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder='Enter your password'
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 pr-10 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-tertiary dark:border-dark-tertiary dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-white bg-blue-primary rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <ButtonSpinner />
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            'Sign in'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
