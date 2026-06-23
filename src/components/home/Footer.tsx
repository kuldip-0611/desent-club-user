'use client';

import Image from 'next/image';

const footerLinks = ['About', 'Contact', 'Privacy'];
const socials = ['Instagram', 'X', 'YouTube'];

export const Footer = () => (
  <footer className="border-t border-white/10 bg-black/50 px-4 py-10 backdrop-blur sm:px-8">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Disent Club logo" width={30} height={30} className="rounded-md" />
          <p className="text-lg font-semibold tracking-[0.15em] text-white">DISENT CLUB</p>
        </div>
        <p className="mt-1 text-sm text-white/60">Premium athleisure for modern wardrobes.</p>
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-white/70">
        {footerLinks.map((link) => (
          <a key={link} href="#" className="transition hover:text-white">
            {link}
          </a>
        ))}
      </div>

      <div className="flex gap-4 text-sm text-white/70">
        {socials.map((social) => (
          <a key={social} href="#" className="transition hover:-translate-y-0.5 hover:text-white">
            {social}
          </a>
        ))}
      </div>
    </div>
  </footer>
);
