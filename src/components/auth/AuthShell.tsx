import { ReactNode } from 'react';
import Image from 'next/image';
import { colors, gradients } from '@/src/styles/colors';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export const AuthShell = ({ title, subtitle, children }: AuthShellProps) => (
  <section
    className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
    style={{ backgroundColor: colors.appBackground }}
  >
    <div className="absolute inset-0" style={{ backgroundImage: gradients.authShellBackground }} />
    <div className="absolute left-[12%] top-[18%] h-28 w-28 rounded-full bg-sky-500/20 blur-3xl" />
    <div className="absolute bottom-[14%] right-[14%] h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl" />
    <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
      <header className="mb-6 space-y-1 text-center">
        <div className="mb-3 flex justify-center">
          <Image
            src="/logo.png"
            alt="Disent Clung logo"
            width={52}
            height={52}
            className="rounded-lg ring-1 ring-white/30"
          />
        </div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-white/70">{subtitle}</p>
      </header>
      {children}
    </div>
  </section>
);
