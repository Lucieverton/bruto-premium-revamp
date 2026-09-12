import { useCallback, useEffect, useRef, useState } from 'react';
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

// Helper to encode Uint8Array to base64url
function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export type PushRegistrationState =
  | 'idle'
  | 'unsupported'
  | 'denied'
  | 'registered'
  | 'error';

export interface PushStatus {
  state: PushRegistrationState;
  /** Last error/reason, when state is 'error' */
  detail?: string;
  /** When the device registration was (re)confirmed */
  registeredAt?: Date;
}

/**
 * Registers the barber's browser for Web Push notifications so the phone
 * receives alerts even when locked or with the app in the background.
 *
 * Flow:
 * 1. Fetch the current VAPID public key from the edge function
 * 2. Compare it with the existing browser subscription; resubscribe if it changed
 * 3. Save the subscription and drop outdated rows for this barber/device
 */
export const usePushSubscription = (barberId: string | null) => {
  const [status, setStatus] = useState<PushStatus>({ state: 'idle' });
  const barberIdRef = useRef(barberId);
  const runningRef = useRef(false);

  useEffect(() => {
    barberIdRef.current = barberId;
  }, [barberId]);

  const register = useCallback(
    async (askPermission = true): Promise<PushStatus> => {
      const currentBarberId = barberIdRef.current;
      if (!currentBarberId) return { state: 'idle' };

      if (
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        const s: PushStatus = { state: 'unsupported' };
        setStatus(s);
        return s;
      }

      if (runningRef.current) return status;
      runningRef.current = true;

      try {
        // 1. Permission
        let permission = Notification.permission;
        if (permission === 'default' && askPermission) {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted') {
          const s: PushStatus = { state: 'denied' };
          setStatus(s);
          return s;
        }

        // 2. Current VAPID public key
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
          {
            method: 'GET',
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          },
        );

        if (!res.ok) {
          const s: PushStatus = {
            state: 'error',
            detail: `Chave indisponível (${res.status})`,
          };
          setStatus(s);
          return s;
        }

        const { publicKey } = await res.json();
        if (!publicKey) {
          const s: PushStatus = { state: 'error', detail: 'Chave não configurada' };
          setStatus(s);
          return s;
        }

        // 3. Service worker
        const registration = (await navigator.serviceWorker
          .ready) as ServiceWorkerRegistration & { pushManager: PushManager };

        // 4. Existing subscription — resubscribe when the key changed
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          const existingKey = subscription.options?.applicationServerKey;
          const existingKeyB64 = existingKey
            ? base64UrlEncode(new Uint8Array(existingKey as ArrayBuffer))
            : null;
          if (existingKeyB64 !== publicKey) {
            console.log('[Push] Key changed — resubscribing');
            const oldEndpoint = subscription.endpoint;
            await subscription.unsubscribe().catch(() => undefined);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('barber_id', currentBarberId)
              .eq('endpoint', oldEndpoint);
            subscription = null;
          }
        }

        if (!subscription) {
          const appServerKey = urlBase64ToUint8Array(publicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey.buffer as ArrayBuffer,
          });
          console.log('[Push] New push subscription created');
        }

        // 5. Save (and clean up outdated rows for this barber)
        const keys = subscription.toJSON().keys!;
        const { error } = await supabase.from('push_subscriptions').upsert(
          {
            barber_id: currentBarberId,
            endpoint: subscription.endpoint,
            p256dh: keys.p256dh!,
            auth: keys.auth!,
          },
          { onConflict: 'barber_id,endpoint' },
        );

        if (error) {
          const s: PushStatus = { state: 'error', detail: error.message };
          setStatus(s);
          return s;
        }

        const s: PushStatus = { state: 'registered', registeredAt: new Date() };
        setStatus(s);
        console.log('[Push] ✅ Subscription saved for barber:', currentBarberId);
        return s;
      } catch (err) {
        const s: PushStatus = { state: 'error', detail: String(err) };
        setStatus(s);
        console.error('[Push] Subscription failed:', err);
        return s;
      } finally {
        runningRef.current = false;
      }
    },
    [status],
  );

  useEffect(() => {
    if (!barberId) return;

    // Never prompt automatically — only re-validate an existing permission.
    const timer = setTimeout(() => register(false), 2000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') register(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  return { status, register };
};
