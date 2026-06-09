'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [router, user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  if (!user) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-600">Loading...</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Account</h1>
        <p className="mt-2 text-sm text-slate-500">You are signed in.</p>

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
            <span className="font-medium text-slate-900">Verified:</span> {user.isVerified ? 'Yes' : 'No'}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/home"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}
