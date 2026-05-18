type AnalyticsParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(action: string, params?: AnalyticsParams) {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', action, params ?? {});
}
