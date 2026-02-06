// PWA registration helper

// Ensure service worker is registered and fully active
export const ensureServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null;

  try {
    // Wait for the SW to be ready (registered + activated)
    const registration = await navigator.serviceWorker.ready;
    console.log('[PWA] Service Worker ready:', registration.scope, 'active:', !!registration.active);
    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
};

// Request notification permission and return status
export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('[PWA] This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    // Pre-warm the SW so it's ready for notifications
    await ensureServiceWorker();
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Pre-warm the SW
      await ensureServiceWorker();
    }
    return permission;
  }

  return Notification.permission;
};

// Extended options for SW notifications (supports vibrate, renotify, etc.)
export interface SWNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Show notification via Service Worker (works in background on mobile).
 * Falls back to regular Notification API if SW is unavailable.
 */
export const showSWNotification = async (
  title: string,
  options?: SWNotificationOptions
): Promise<boolean> => {
  const finalOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [500, 200, 500] as number[],
    tag: 'queue-notification',
    renotify: true,
    requireInteraction: true,
    ...options,
  };

  // Method 1: Service Worker notification (works in background on mobile)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.active) {
        await registration.showNotification(title, finalOptions as NotificationOptions);
        console.log('[PWA] SW notification sent:', title);
        return true;
      }
    } catch (e) {
      console.warn('[PWA] SW notification failed:', e);
    }
  }

  // Method 2: Fallback to regular Notification API (only works when tab is focused)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: finalOptions.body,
        icon: finalOptions.icon,
        badge: finalOptions.badge,
        tag: finalOptions.tag,
      });
      console.log('[PWA] Fallback notification sent:', title);
      return true;
    } catch (e) {
      console.warn('[PWA] Fallback notification failed:', e);
    }
  }

  console.warn('[PWA] No notification method available');
  return false;
};

/**
 * Send a test notification to verify the system works.
 * Useful for the barber to test on their phone.
 */
export const sendTestNotification = async (): Promise<boolean> => {
  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    return false;
  }

  return showSWNotification('🔔 Teste de Notificação', {
    body: 'As notificações estão funcionando corretamente! Você receberá alertas quando novos clientes entrarem na sua fila.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'test-notification',
    renotify: true,
    requireInteraction: false,
  });
};
