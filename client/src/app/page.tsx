"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from './redux';
import { ArrowRight, LogIn, LayoutDashboard } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

// This component acts as a Landing Page and gatekeeper for your application.
export default function HomePage() {
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);
  
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  useEffect(() => {
    if (!token) {
      setAuthStatus("unauthenticated");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        console.log('Token expired on landing page');
        setAuthStatus("unauthenticated");
      } else {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8008';
        fetch(`${apiBaseUrl}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            if (response.status === 401) {
              console.log('Server rejected token on landing page');
              setAuthStatus("unauthenticated");
            } else {
              setAuthStatus("authenticated");
            }
          })
          .catch(() => {
            // If fetch fails, we assume they might be offline or server is down,
            // but we have a token, so we let them try to go to dashboard.
            setAuthStatus("authenticated");
          });
      }
    } catch (error) {
      console.error('Invalid token format:', error);
      setAuthStatus("unauthenticated");
    }
  }, [token]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#111315]">
      {/* Background decorations (Glassmorphism blobs) */}
      <div className="pointer-events-none absolute -top-[20%] -left-[10%] h-[50vh] w-[50vh] rounded-full bg-blue-500/20 blur-[120px] dark:bg-blue-600/20"></div>
      <div className="pointer-events-none absolute -bottom-[20%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-600/20"></div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center mt-20">
        <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-3 py-1 mb-8 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-sm">
            ✨ Your Premium Workspace Awaits
        </div>
        <h1 className="mb-6 bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-gray-400 sm:text-7xl">
          Supercharge Your Workflow
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl leading-relaxed">
          The ultimate project management platform to organize tasks, manage teams, and deliver exceptional results on time. Eliminate friction and accelerate delivery.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {authStatus === "checking" ? (
            <div className="flex items-center gap-3 rounded-full bg-white px-8 py-4 shadow-md border border-gray-100 dark:border-white/5 dark:bg-white/5">
              <LoadingSpinner size="sm" color="primary" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Evaluating session...</span>
            </div>
          ) : authStatus === "authenticated" ? (
            <button
              onClick={() => router.push('/home')}
              className="group flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-500/25 sm:w-auto ring-1 ring-blue-500/50"
            >
              <LayoutDashboard size={20} />
              Go to Dashboard
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="group flex items-center justify-center gap-2 rounded-full bg-gray-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-black hover:shadow-gray-900/25 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 sm:w-auto"
            >
              <LogIn size={20} />
              Log In to Continue
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>

      {/* Feature showcase snippet */}
      <div className="relative z-10 mx-auto mt-20 mb-20 max-w-5xl px-6 w-full">
        <div className="rounded-2xl border border-gray-200/60 bg-white/60 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="aspect-[21/9] w-full rounded-xl bg-gray-100 dark:bg-[#1d1f21] flex items-center justify-center overflow-hidden relative border border-gray-200/50 dark:border-[#2d3135]">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10"></div>
                
                {/* Abstract UI Elements to look like a dashboard */}
                <div className="absolute top-4 left-4 right-4 bottom-4 flex gap-4 opacity-50 dark:opacity-40 pointer-events-none">
                    <div className="w-1/4 rounded-lg bg-white dark:bg-dark-secondary shadow-sm"></div>
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="h-16 rounded-lg bg-white dark:bg-dark-secondary shadow-sm"></div>
                        <div className="flex-1 rounded-lg bg-white dark:bg-dark-secondary shadow-sm"></div>
                    </div>
                </div>

                <p className="text-gray-500 dark:text-gray-400 font-semibold tracking-wide uppercase text-sm z-10 bg-white/80 dark:bg-dark-secondary/80 px-4 py-2 rounded-full backdrop-blur-md shadow-sm border border-gray-200 dark:border-dark-tertiary">
                   Enterprise Grade Workflow
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
