'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Onboarding from '@/components/Onboarding';
import { isAuthenticated } from '@/lib/auth-utils';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      if (!isAuthenticated()) {
        console.log('Dashboard: No auth credentials found, redirecting to login');
        router.push('/auth/login');
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-purple-900">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
      <Onboarding />
    </main>
  );
}