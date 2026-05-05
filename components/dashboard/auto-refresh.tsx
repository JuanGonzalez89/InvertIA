'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AutoRefreshProps {
  intervalMs?: number;
  enabled?: boolean;
}

export function AutoRefresh({ intervalMs = 300000, enabled = true }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      console.log('[AutoRefresh] Refreshing data...');
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs, router]);

  return null;
}
