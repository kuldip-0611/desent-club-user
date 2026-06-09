'use client';

import { ChangeEvent, ClipboardEvent, KeyboardEvent, useMemo, useRef } from 'react';

type OtpInputProps = {
  value: string;
  length?: number;
  onChange: (value: string) => void;
};

const digitsOnly = (s: string) => s.replace(/\D/g, '');

export const OtpInput = ({ value, length = 6, onChange }: OtpInputProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ''),
    [length, value],
  );

  const applyBulkDigits = (raw: string) => {
    const bulk = digitsOnly(raw).slice(0, length);
    if (!bulk) {
      return;
    }

    onChange(bulk);
    queueMicrotask(() => {
      const focusIndex = Math.min(Math.max(bulk.length - 1, 0), length - 1);
      inputRefs.current[focusIndex]?.focus();
      inputRefs.current[focusIndex]?.select();
    });
  };

  const handleInput = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const raw = digitsOnly(event.target.value);

    // Paste, SMS autofill, or OTP autofill can inject multiple digits at once
    if (raw.length > 1) {
      applyBulkDigits(raw);
      return;
    }

    const nextDigit = raw.slice(-1);
    const next = [...digits];
    next[index] = nextDigit;
    const nextValue = next.join('').replace(/\D/g, '');
    onChange(nextValue);

    if (nextDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = digitsOnly(pasted).slice(0, length);
    if (!cleaned) {
      return;
    }

    event.preventDefault();
    applyBulkDigits(cleaned);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={`otp-${index + 1}`}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          onChange={(event) => handleInput(index, event)}
          onPaste={handlePaste}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-12 w-10 rounded-xl border border-white/20 bg-white/10 text-center text-lg font-semibold text-white focus:border-sky-300 focus:outline-none sm:w-12"
          aria-label={`OTP digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
};
