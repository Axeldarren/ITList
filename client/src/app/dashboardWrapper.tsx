"use client";

import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";
import { Toaster } from "react-hot-toast";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    console.log("isDarkMode state:", isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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
        className={`flex w-full flex-col bg-gray-50 dark:bg-dark-bg ${
          isSidebarCollapsed ? "" : "md:pl-64"
        }`}
      >
        {/* navbar */}
        <Navbar />
        {children}
      </main>
    </div>
  );
}

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </StoreProvider>
  )
}

export default DashboardWrapper;