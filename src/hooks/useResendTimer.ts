'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_DURATION = 30;

export const useResendTimer = (duration = DEFAULT_DURATION) => {
  const [secondsLeft, setSecondsLeft] = useState(duration);

  useEffect(() => {
    if (secondsLeft === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [secondsLeft]);

  const canResend = secondsLeft === 0;

  const formatted = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (secondsLeft % 60).toString().padStart(2, '0');

    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  const restart = () => {
    setSecondsLeft(duration);
  };

  return {
    canResend,
    formatted,
    restart,
  };
};
