'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

const THRESHOLDS = [25, 50, 75, 100];

export default function ScrollTracker() {
  const fired = useRef<Set<number>>(new Set());
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) {
        return;
      }

      rafId.current = window.requestAnimationFrame(() => {
        rafId.current = null;

        const doc = document.documentElement;
        const scrollHeight = doc.scrollHeight;
        if (!scrollHeight) {
          return;
        }

        const scrollTop = window.scrollY || doc.scrollTop;
        const viewportHeight = window.innerHeight || doc.clientHeight;
        const depth = Math.round(((scrollTop + viewportHeight) / scrollHeight) * 100);

        if (typeof window.gtag !== 'function') {
          return;
        }

        THRESHOLDS.forEach((threshold) => {
          if (depth >= threshold && !fired.current.has(threshold)) {
            fired.current.add(threshold);
            trackEvent('scroll_depth', {
              percent: threshold,
              path: window.location.pathname,
            });
          }
        });
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return null;
}
