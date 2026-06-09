'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { clearAuthSession, getAuthUser } from '@/src/utils/auth';

export default function DashboardPage() {
  const router = useRouter();
  const user = useMemo(() => getAuthUser(), []);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [router, user]);

  const handleLogout = () => {
    clearAuthSession();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  if (!user) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-600">Loading dashboard...</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">You are now authenticated.</p>

        <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Name:</span> {user.name}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Email:</span> {user.email ?? 'N/A'}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Phone:</span> {user.phone ?? 'N/A'}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Provider:</span> {user.provider}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Logout
        </button>
      </div>
    </section>
  );
}
