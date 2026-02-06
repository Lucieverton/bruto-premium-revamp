// PWA registration helper
export const registerPWA = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Request notification permission and return status
export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

// Show notification via Service Worker (works in background)
// Extended options for SW notifications (supports vibrate, renotify, etc.)
export interface SWNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  [key: string]: unknown;
}

export const showSWNotification = async (
  title: string,
  options?: SWNotificationOptions
) => {
  // Try Service Worker notification first (works in background)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [500, 200, 500],
        tag: 'novo-cliente',
        renotify: true,
        requireInteraction: true,
        ...options,
      } as any);
      return true;
    } catch (e) {
      console.warn('SW notification failed, falling back:', e);
    }
  }

  // Fallback to regular Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });
    return true;
  }

  return false;
};
