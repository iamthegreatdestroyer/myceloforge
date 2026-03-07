/**
 * Performance monitoring for Core Web Vitals
 * Tracks LCP, FID, CLS, and other performance metrics
 */

import { logger } from '@/lib/logger';

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  navigationTiming?: PerformanceNavigationTiming;
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initializePerformanceMonitoring(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    console.warn('Performance monitoring not available');
    return;
  }

  try {
    // Monitor Largest Contentful Paint (LCP)
    monitorLCP();

    // Monitor First Input Delay (FID) / Interaction to Next Paint (INP)
    monitorInputDelay();

    // Monitor Cumulative Layout Shift (CLS)
    monitorCLS();

    // Monitor First Contentful Paint (FCP)
    monitorFCP();

    // Monitor page visibility for accurate metrics
    monitorPageVisibility();

    logger.info('Performance monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize performance monitoring', {}, error as Error);
  }
}

/**
 * Monitor Largest Contentful Paint (LCP)
 * SLA Target: < 2.5s
 */
function monitorLCP(): void {
  try {
    const lcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (lastEntry) {
        const lcpTime = lastEntry.renderTime || lastEntry.loadTime;

        logger.info('LCP metric recorded', {
          lcp: lcpTime,
          element: (lastEntry as any).element?.tagName,
          url: (lastEntry as any).url,
        });

        // Send to analytics
        sendMetricToAnalytics('LCP', lcpTime);

        // Alert if exceeds threshold
        if (lcpTime > 2500) {
          logger.warn('LCP exceeds threshold', { lcp: lcpTime });
        }
      }
    });

    lcp.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.error('LCP monitoring failed:', error);
  }
}

/**
 * Monitor First Input Delay (FID) / Interaction to Next Paint (INP)
 * SLA Target: < 100ms
 */
function monitorInputDelay(): void {
  try {
    // Try FID first (for older browsers), then fall back to INP
    const inputObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        const inputDelay = entry.processingDuration;

        logger.info('Input delay metric recorded', {
          inputDelay,
          type: entry.entryType,
        });

        // Send to analytics
        sendMetricToAnalytics(entry.entryType.toUpperCase(), inputDelay);

        // Alert if exceeds threshold
        if (inputDelay > 100) {
          logger.warn('Input delay exceeds threshold', {
            delay: inputDelay,
            type: entry.entryType,
          });
        }
      });
    });

    // Observe both FID and INP
    const entryTypes = [];
    if (PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
      entryTypes.push('first-input');
    }
    if (PerformanceObserver.supportedEntryTypes?.includes('interaction-to-next-paint')) {
      entryTypes.push('interaction-to-next-paint');
    }

    if (entryTypes.length > 0) {
      inputObserver.observe({ entryTypes });
    }
  } catch (error) {
    console.error('Input delay monitoring failed:', error);
  }
}

/**
 * Monitor Cumulative Layout Shift (CLS)
 * SLA Target: < 0.1
 */
function monitorCLS(): void {
  try {
    let clsValue = 0;

    const cls = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        // Only count layout shifts without user input
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;

          logger.info('CLS metric recorded', {
            cls: clsValue,
            shift: (entry as any).value,
          });

          // Send to analytics
          sendMetricToAnalytics('CLS', clsValue);

          // Alert if exceeds threshold
          if (clsValue > 0.1) {
            logger.warn('CLS exceeds threshold', { cls: clsValue });
          }
        }
      });
    });

    cls.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.error('CLS monitoring failed:', error);
  }
}

/**
 * Monitor First Contentful Paint (FCP)
 * SLA Target: < 1.8s
 */
function monitorFCP(): void {
  try {
    const fcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');

      if (fcpEntry) {
        const fcpTime = fcpEntry.startTime;

        logger.info('FCP metric recorded', { fcp: fcpTime });

        // Send to analytics
        sendMetricToAnalytics('FCP', fcpTime);

        // Alert if exceeds threshold
        if (fcpTime > 1800) {
          logger.warn('FCP exceeds threshold', { fcp: fcpTime });
        }
      }
    });

    fcp.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.error('FCP monitoring failed:', error);
  }
}

/**
 * Monitor page visibility to avoid counting hidden tab metrics
 */
function monitorPageVisibility(): void {
  try {
    document.addEventListener('visibilitychange', () => {
      const state = document.hidden ? 'hidden' : 'visible';
      logger.info('Page visibility changed', { state });

      // Stop metrics collection for hidden pages
      if (document.hidden) {
        logger.debug('Page hidden, pausing performance monitoring');
      } else {
        logger.debug('Page visible, resuming performance monitoring');
      }
    });
  } catch (error) {
    console.error('Visibility monitoring failed:', error);
  }
}

/**
 * Send performance metric to analytics service
 */
function sendMetricToAnalytics(metricName: string, value: number): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    return;
  }

  try {
    // Use sendBeacon for reliability (doesn't block navigation)
    const data = new FormData();
    data.append('metric', metricName);
    data.append('value', value.toString());

    navigator.sendBeacon(process.env.NEXT_PUBLIC_ANALYTICS_URL, JSON.stringify({ metric: metricName, value }));
  } catch (error) {
    console.error('Failed to send metric:', error);
  }
}

/**
 * Get current performance summary
 */
export function getPerformanceSummary(): PerformanceMetrics {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const timing = performance.timing;
    const navigation = performance.navigation;

    return {
      ttfb: timing.responseStart - timing.fetchStart,
      navigationTiming: {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
      } as any,
    };
  } catch (error) {
    console.error('Failed to get performance summary:', error);
    return {};
  }
}

/**
 * Create performance report for debugging
 */
export function createPerformanceReport(): string {
  const metrics = getPerformanceSummary();

  return `
Performance Report
==================
TTFB: ${metrics.ttfb}ms
Navigation Timing:
  - DOM Content Loaded: ${(metrics.navigationTiming as any)?.domContentLoaded}ms
  - Load Complete: ${(metrics.navigationTiming as any)?.loadComplete}ms

Core Web Vitals Targets:
  - LCP: < 2500ms
  - FID: < 100ms
  - CLS: < 0.1
  - FCP: < 1800ms
  `;
}
