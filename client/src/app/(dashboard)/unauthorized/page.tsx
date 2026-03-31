"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldX } from 'lucide-react';
import Header from '@/components/Header';

const roleMessages: Record<string, string> = {
    ADMIN: "This page requires an Admin account.",
    BUSINESS_OWNER: "This page is restricted to Business Owners.",
    ADMIN_OR_BO: "This page is restricted to Admins and Business Owners.",
};

const UnauthorizedPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const required = searchParams.get('required');
    const message = required && roleMessages[required]
        ? roleMessages[required]
        : "You don't have permission to view this page. Contact your administrator if you believe this is an error.";

    return (
        <div className="p-8">
            <Header name="Access Denied" />
            <div className="flex flex-col items-center justify-center mt-24 gap-4 text-center">
                <ShieldX size={64} className="text-red-400" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    403 — Unauthorized
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    {message}
                </p>
                <button
                    onClick={() => router.push('/home')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Go to Home
                </button>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
