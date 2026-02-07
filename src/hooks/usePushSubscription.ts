import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Convert a VAPID public key from base64url to Uint8Array
 * (required by pushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the barber's browser for Web Push notifications.
 * This ensures Chrome sends push notifications even when the phone is locked.
 *
 * Flow:
 * 1. Fetch VAPID public key from edge function
 * 2. Subscribe to PushManager with the key
 * 3. Save subscription to push_subscriptions table
 */
export const usePushSubscription = (barberId: string | null) => {
  const subscribedRef = useRef(false);
  const barberIdRef = useRef(barberId);

  useEffect(() => {
    barberIdRef.current = barberId;
  }, [barberId]);

  useEffect(() => {
    if (!barberId || subscribedRef.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] PushManager not supported');
      return;
    }

    const subscribe = async () => {
      try {
        // 1. Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('[Push] Notification permission denied');
          return;
        }

        // 2. Get VAPID public key from edge function
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.warn('[Push] No auth session');
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error('[Push] Failed to get VAPID key:', res.status);
          return;
        }

        const { publicKey } = await res.json();
        if (!publicKey) {
          console.error('[Push] No public key returned');
          return;
        }

        console.log('[Push] Got VAPID public key');

        // 3. Wait for SW to be ready
        const registration = await navigator.serviceWorker.ready;

        // 4. Check existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Verify it's using the same key
          const existingKey = subscription.options?.applicationServerKey;
          if (existingKey) {
            const existingKeyArr = new Uint8Array(existingKey as ArrayBuffer);
            const existingKeyB64 = base64UrlEncode(existingKeyArr);
            if (existingKeyB64 !== publicKey) {
              // Key changed, unsubscribe and resubscribe
              await subscription.unsubscribe();
              subscription = null;
              console.log('[Push] Key changed, resubscribing');
            }
          }
        }

        if (!subscription) {
          // 5. Subscribe to push
          const appServerKey = urlBase64ToUint8Array(publicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey.buffer as ArrayBuffer,
          });
          console.log('[Push] New push subscription created');
        }

        // 6. Save subscription to database
        const keys = subscription.toJSON().keys!;
        const currentBarberId = barberIdRef.current;
        if (!currentBarberId) return;

        const { error } = await supabase.from('push_subscriptions').upsert(
          {
            barber_id: currentBarberId,
            endpoint: subscription.endpoint,
            p256dh: keys.p256dh!,
            auth: keys.auth!,
          },
          { onConflict: 'barber_id,endpoint' }
        );

        if (error) {
          console.error('[Push] Failed to save subscription:', error);
        } else {
          console.log('[Push] ✅ Subscription saved for barber:', currentBarberId);
          subscribedRef.current = true;
        }
      } catch (err) {
        console.error('[Push] Subscription failed:', err);
      }
    };

    // Small delay to let the page settle
    const timer = setTimeout(subscribe, 2000);
    return () => clearTimeout(timer);
  }, [barberId]);
};

// Helper to encode Uint8Array to base64url
function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
