import { ReactNode } from 'react';
import Image from 'next/image';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export const AuthShell = ({ title, subtitle, children }: AuthShellProps) => (
  <section className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-slate-950">
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/logo.png"
          alt="Disent Club logo"
          width={52}
          height={52}
          className="rounded-xl"
        />
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Disent Club</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  </section>
);
