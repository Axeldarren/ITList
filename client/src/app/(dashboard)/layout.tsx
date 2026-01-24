"use client";

import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAppSelector } from "../redux";
import { useRouter } from "next/navigation";
import { useWebSocketQuery } from "@/state/api";
import { Toaster } from "react-hot-toast";
import { FullPageLoading } from "@/components/LoadingSpinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const { error } = useWebSocketQuery();
  
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    // If the user is not logged in, redirect them to the login page
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  useEffect(() => {
    // Handle 401 errors or token expiration
    if (error && 'status' in error && error.status === 401) {
      localStorage.clear();
      router.replace('/login');
    }
  }, [error, router]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // While checking for the token, you can show a loading state or nothing
  if (!token) {
      return <FullPageLoading />;
  }

  // If the token exists, render the full dashboard layout
  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDarkMode ? '#3b3d40' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#101214',
          },
        }}
      />
      <Sidebar />
      <main
        className={`flex w-full flex-col bg-gray-50 dark:bg-dark-bg transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "pl-0 md:pl-[60px]" : "pl-64"
        }`}
      >
        <Navbar />
        {children}
      </main>
    </div>
  );
}