"use client";

import React, { useEffect, useState } from 'react';
import { useLoginMutation } from '@/state/api';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setCredentials } from '@/state/authSlice';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { ButtonSpinner, FullPageLoading } from '@/components/LoadingSpinner';
import { Mail, Lock, Zap, Shield, Users } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [login, { isLoading }] = useLoginMutation();
    const token = useAppSelector((s) => s.auth.token);
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDarkMode]);

    useEffect(() => {
        if (token) {
            router.replace('/home');
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, token } = await login({ email, password }).unwrap();
            dispatch(setCredentials({ user: data.user, token }));
            toast.success('Login successful!');
            router.push('/home');
        } catch (err: unknown) {
            const error = err as { data?: { message?: string } };
            toast.error(error.data?.message || 'Failed to login. Please check your credentials.');
        }
    };

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
        <>
            <style>{`
                @keyframes lgFadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes lgBlink {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0; }
                }
                .lg-a1 { animation: lgFadeUp 0.45s 0.00s ease both; }
                .lg-a2 { animation: lgFadeUp 0.45s 0.10s ease both; }
                .lg-a3 { animation: lgFadeUp 0.45s 0.20s ease both; }
                .lg-a4 { animation: lgFadeUp 0.45s 0.30s ease both; }
                .lg-a5 { animation: lgFadeUp 0.45s 0.40s ease both; }
                .lg-caret { animation: lgBlink 1s step-end infinite; color: #7c5cfc; }

                .lg-submit-btn {
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .lg-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 28px rgba(124,92,252,0.38);
                }

                @media (max-width: 720px) {
                    .lg-left { display: none !important; }
                }
            `}</style>

            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: isDarkMode ? '#3b3d40' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#101214',
                    },
                }}
            />

            <div className="flex min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100">

                {/* ── Left panel — Branding ── */}
                <div
                    className="lg-left w-5/12 flex-shrink-0 bg-white dark:bg-dark-secondary border-r border-gray-200 dark:border-stroke-dark p-12 flex flex-col justify-between relative overflow-hidden"
                >
                    {/* Dot grid */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(124,92,252,0.07) 1px, transparent 1px)',
                            backgroundSize: '28px 28px',
                        }}
                    />

                    {/* Ambient glow */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            bottom: '-15%', left: '-10%',
                            width: '55%', height: '55%',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 70%)',
                        }}
                    />

                    {/* Corner accents */}
                    <div className="absolute top-10 right-10 w-5 h-5 border-t border-r border-accent-200 dark:border-accent-500/25 pointer-events-none" />
                    <div className="absolute bottom-10 left-10 w-5 h-5 border-b border-l border-accent-200 dark:border-accent-500/25 pointer-events-none" />

                    {/* Top: branding */}
                    <div className="relative z-10">
                        {/* Status badge */}
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-stroke-dark mb-12"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em' }}
                        >
                            <div
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }}
                            />
                            <span className="text-gray-400 dark:text-gray-500">ITLIST SYSTEM</span>
                        </div>

                        {/* Wordmark */}
                        <div className="mb-6" style={{ lineHeight: 0.88 }}>
                            <div
                                className="text-gray-900 dark:text-white"
                                style={{
                                    fontFamily: 'var(--font-bebas)',
                                    fontSize: 'clamp(60px, 7vw, 100px)',
                                    letterSpacing: '0.02em',
                                }}
                            >IT</div>
                            <div
                                style={{
                                    fontFamily: 'var(--font-bebas)',
                                    fontSize: 'clamp(60px, 7vw, 100px)',
                                    letterSpacing: '0.02em',
                                    background: 'linear-gradient(130deg, #7c5cfc 0%, #a78bfa 60%, #c4b5fd 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >LIST</div>
                        </div>

                        {/* Tagline */}
                        <div
                            className="text-gray-400 dark:text-gray-500"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 2, letterSpacing: '0.03em' }}
                        >
                            <div><span className="text-blue-primary mr-2">›</span>Track every task.</div>
                            <div><span className="text-blue-primary mr-2">›</span>Manage every project.</div>
                            <div><span className="text-blue-primary mr-2">›</span>Ship with confidence<span className="lg-caret">_</span></div>
                        </div>
                    </div>

                    {/* Bottom: feature list */}
                    <div className="relative z-10 border-t border-gray-100 dark:border-stroke-dark pt-5">
                        {[
                            { icon: <Shield size={13} />, label: 'End-to-end encryption' },
                            { icon: <Zap size={13} />, label: 'Real-time synchronization' },
                            { icon: <Users size={13} />, label: 'Role-based access control' },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 mb-2.5 text-gray-400 dark:text-gray-500"
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                            >
                                <span className="text-accent-400 flex-shrink-0">{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right panel — Form ── */}
                <div className="flex-1 flex items-center justify-center px-8 md:px-16 py-12 relative">
                    <div className="w-full max-w-sm">

                        {/* Header */}
                        <div className="lg-a1 mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-500/10 border border-accent-100 dark:border-accent-500/20 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 5px rgba(16,185,129,0.8)' }} />
                                <span className="text-accent-600 dark:text-accent-400" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em' }}>
                                    ITLIST · SECURE LOGIN
                                </span>
                            </div>
                            <h1
                                className="text-gray-900 dark:text-white mb-1.5"
                                style={{ fontFamily: 'var(--font-bebas)', fontSize: '36px', letterSpacing: '0.04em' }}
                            >
                                WELCOME BACK
                            </h1>
                            <p
                                className="text-gray-400 dark:text-gray-500"
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em' }}
                            >
                                SIGN IN TO YOUR WORKSPACE
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>

                            {/* Email */}
                            <div className="lg-a2 mb-5">
                                <label
                                    htmlFor="email"
                                    className="block text-blue-primary mb-2"
                                    style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em' }}
                                >
                                    EMAIL ADDRESS
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                                        <Mail size={15} />
                                    </span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:bg-white dark:focus:bg-white/5 transition-all"
                                        style={{ caretColor: '#7c5cfc' }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="lg-a3 mb-8">
                                <label
                                    htmlFor="password"
                                    className="block text-blue-primary mb-2"
                                    style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em' }}
                                >
                                    PASSWORD
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                                        <Lock size={15} />
                                    </span>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:bg-white dark:focus:bg-white/5 transition-all"
                                        style={{ caretColor: '#7c5cfc' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-primary transition-colors p-0 bg-transparent border-0 cursor-pointer flex"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="lg-a4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="lg-submit-btn w-full bg-blue-primary hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-between"
                                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2.5 mx-auto">
                                            <ButtonSpinner />
                                            <span>AUTHENTICATING...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span>SIGN IN</span>
                                            <span style={{ fontSize: '18px' }}>→</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Footer note */}
                        <div className="lg-a5 mt-8 text-center">
                            <p
                                className="text-gray-300 dark:text-gray-600"
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.05em' }}
                            >
                                Access is restricted to team members · ITList v2.0
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
};

export default LoginPage;
