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
    // Check if token exists and is not expired
    if (token) {
      try {
        // Basic JWT expiration check (assuming token is JWT format)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (isExpired) {
          // Token is expired, redirect to login
          console.log('Token expired, redirecting to login');
          router.replace('/login');
        } else {
          // Token is valid, go to dashboard
          // Add a failsafe for 401 responses
          fetch('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(response => {
              if (response.status === 401) {
                console.log('Server rejected token, redirecting to login');
                router.replace('/login');
              } else {
                router.replace('/home');
              }
            })
            .catch(() => {
              // If the verification fails for any reason, continue to home
              // The API will handle unauthorized requests
              router.replace('/home');
            });
        }
      } catch (error) {
        // If token parsing fails, redirect to login
        console.error('Invalid token format:', error);
        router.replace('/login');
      }
    } else {
      // No token, redirect to login page
      router.replace('/login');
    }
    }, [token, router]);

  // Display a loading indicator while the redirect happens.
  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}
