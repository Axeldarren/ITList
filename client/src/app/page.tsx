"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from './redux';

// This component acts as a gatekeeper for your application's entry point.
export default function HomePage() {
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If a token exists (user is logged in), go to the dashboard home.
    // Otherwise, redirect to the login page.
    if (token) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [token, router]);

  // Display a loading indicator while the redirect happens.
  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}
