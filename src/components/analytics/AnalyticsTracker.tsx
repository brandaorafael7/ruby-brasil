'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    const isProductPage = pathname.startsWith('/produto/');
    trackAnalyticsEvent({
      eventType: isProductPage ? 'PRODUCT_VIEW' : 'PAGE_VIEW',
      path: pathname,
    });
  }, [pathname]);

  return null;
}
