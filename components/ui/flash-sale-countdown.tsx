'use client';

import { useEffect, useState } from 'react';

interface FlashSaleCountdownProps {
  endsAt: string | Date;
  salePrice: number;
  originalPrice: number;
  label?: string;
}

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const expired = timeLeft === 0;

  return { hours, minutes, seconds, expired };
}

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[2rem] rounded bg-red-600 px-2 py-0.5 text-center text-sm font-bold tabular-nums text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-0.5 text-[10px] text-slate-500">{label}</span>
    </div>
  );
}

export function FlashSaleCountdown({ endsAt, salePrice, originalPrice, label = 'Flash Sale' }: FlashSaleCountdownProps) {
  const target = endsAt instanceof Date ? endsAt : new Date(endsAt);
  const { hours, minutes, seconds, expired } = useCountdown(target);

  if (expired) return null;

  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
      <span className="text-lg">⚡</span>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">{label}</p>
        <p className="text-xs text-slate-500">Save {discount}% — ends in</p>
      </div>
      <div className="flex items-center gap-1">
        <Segment value={hours} label="hr" />
        <span className="mb-3 text-xs font-bold text-slate-400">:</span>
        <Segment value={minutes} label="min" />
        <span className="mb-3 text-xs font-bold text-slate-400">:</span>
        <Segment value={seconds} label="sec" />
      </div>
    </div>
  );
}
