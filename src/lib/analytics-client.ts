'use client';

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'CATEGORY_FILTER'
  | 'SEARCH'
  | 'CHECKOUT_START'
  | 'WHATSAPP_CLICK';

export interface TrackEventPayload {
  eventType: AnalyticsEventType;
  path?: string;
  productId?: string;
  productName?: string;
  category?: string;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const key = 'ruby_analytics_sid';
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return 'anon';
  }
}

function detectDeviceType(): 'Mobile' | 'Tablet' | 'Desktop' {
  if (typeof window === 'undefined') return 'Mobile';
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (window.innerWidth >= 768 && window.innerWidth <= 1024 && /Android/i.test(ua))) {
    return 'Tablet';
  }
  if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768) {
    return 'Mobile';
  }
  return 'Desktop';
}

function detectReferrerSource(): string {
  if (typeof window === 'undefined') return 'Direto';
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = (params.get('utm_source') || '').toLowerCase();
    if (utmSource.includes('insta') || utmSource === 'ig') return 'Instagram';
    if (utmSource.includes('whats') || utmSource === 'wa') return 'WhatsApp';
    if (utmSource.includes('google')) return 'Google';
    if (utmSource.includes('tiktok')) return 'TikTok';
    if (utmSource.includes('fb') || utmSource.includes('facebook')) return 'Facebook';

    const ref = (document.referrer || '').toLowerCase();
    if (!ref || ref.includes(window.location.hostname)) {
      const savedRef = sessionStorage.getItem('ruby_initial_referrer');
      return savedRef || 'Direto';
    }
    let detected = 'Outros';
    if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) detected = 'Instagram';
    else if (ref.includes('whatsapp.com') || ref.includes('wa.me')) detected = 'WhatsApp';
    else if (ref.includes('google.')) detected = 'Google';
    else if (ref.includes('tiktok.com')) detected = 'TikTok';
    else if (ref.includes('facebook.com') || ref.includes('fb.com')) detected = 'Facebook';

    sessionStorage.setItem('ruby_initial_referrer', detected);
    return detected;
  } catch {
    return 'Direto';
  }
}

export function trackAnalyticsEvent(payload: TrackEventPayload) {
  if (typeof window === 'undefined') return;
  const currentPath = payload.path || window.location.pathname || '/';
  if (currentPath.startsWith('/admin')) return;

  try {
    const body = JSON.stringify({
      eventType: payload.eventType,
      sessionId: getOrCreateSessionId(),
      path: currentPath,
      productId: payload.productId || null,
      productName: payload.productName || null,
      category: payload.category || null,
      device: detectDeviceType(),
      referrer: detectReferrerSource(),
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silencioso para não interferir na navegação do cliente
  }
}
