import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showSWNotification, ensureServiceWorker } from '@/lib/pwa';

// ── Audio alert via Web Audio API ──────────────────────────────────────────
const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not supported — silent fallback
  }
};

const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([500, 200, 500]);
  }
};

// ── Hook ───────────────────────────────────────────────────────────────────
/**
 * Monitors `queue_items` in real-time and fires native PWA notifications
 * to barbers. Designed to survive Chrome mobile background throttling
 * by re-subscribing on visibility change and subscription errors.
 */
export const useQueueAlert = (barberId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Refs to avoid stale closures and unnecessary re-subscriptions
  const barberIdRef = useRef(barberId);
  const processedIdsRef = useRef<Set<string>>(new Set());
  const subscribedAtRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep barber ID in sync without re-running the main effect
  useEffect(() => {
    barberIdRef.current = barberId;
  }, [barberId]);

  // Pre-warm Service Worker once
  useEffect(() => {
    if (!barberId) return;
    ensureServiceWorker().then((reg) => {
      console.log('[QueueAlert] SW ready:', !!reg?.active);
    });
  }, [barberId]);

  // ── Notification helper (stable ref) ──────────────────────────────────
  const fireNotification = useCallback(
    async (title: string, body: string, tag: string) => {
      playAlertSound();
      vibrateDevice();
      toast({ title, description: body, duration: 10_000 });
      await showSWNotification(title, { body, tag, renotify: true });
    },
    [toast],
  );

  // ── Main subscription effect ──────────────────────────────────────────
  useEffect(() => {
    if (!barberId) return;

    /** Create (or re-create) the Realtime channel */
    const subscribe = () => {
      // Tear down previous channel, if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      console.log('[QueueAlert] Subscribing for barber:', barberId);

      // Unique channel name avoids collisions on re-subscribe
      const channel = supabase
        .channel(`queue-alerts-${barberId}-${Date.now()}`)
        // ── INSERT: new client in queue ─────────────────────────────────
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'queue_items' },
          async (payload) => {
            const currentId = barberIdRef.current;
            if (!currentId) return;

            const item = payload.new as any;

            // Client-side filter: my queue OR general queue only
            if (item.barber_id !== null && item.barber_id !== currentId) return;

            // Deduplicate
            if (processedIdsRef.current.has(item.id)) return;

            // Ignore items created before we subscribed (prevents
            // ghost notifications on reconnect / page load)
            const createdMs = new Date(item.created_at).getTime();
            if (createdMs < subscribedAtRef.current) {
              console.log('[QueueAlert] Skipping pre-subscription item:', item.id);
              return;
            }

            processedIdsRef.current.add(item.id);

            // Trim set to prevent memory leak
            if (processedIdsRef.current.size > 100) {
              const arr = Array.from(processedIdsRef.current);
              processedIdsRef.current = new Set(arr.slice(-50));
            }

            const isGeneral = item.barber_id === null;

            // Resolve service name (best-effort)
            let serviceName: string | undefined;
            if (item.service_id) {
              const { data } = await supabase
                .from('services')
                .select('name')
                .eq('id', item.service_id)
                .single();
              serviceName = data?.name;
            }

            const title = isGeneral
              ? '💈 Novo Cliente na Fila Geral!'
              : '💈 Novo Cliente na Sua Fila!';
            const body = `${item.customer_name} aguardando${serviceName ? ` para ${serviceName}` : ''}.`;

            await fireNotification(title, body, isGeneral ? 'fila-geral' : 'novo-cliente');

            console.log('[QueueAlert] ✅ Notified:', {
              isGeneral,
              customer: item.customer_name,
            });

            queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
            queryClient.invalidateQueries({ queryKey: ['today-queue'] });
          },
        )
        // ── UPDATE: transfer ────────────────────────────────────────────
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'queue_items' },
          async (payload) => {
            const currentId = barberIdRef.current;
            if (!currentId) return;

            const updated = payload.new as any;
            const old = payload.old as any;

            // Transfer: was NOT mine, now IS mine
            if (updated.barber_id === currentId && old?.barber_id !== currentId) {
              const dedupeKey = `transfer-${updated.id}`;
              if (processedIdsRef.current.has(dedupeKey)) return;
              processedIdsRef.current.add(dedupeKey);

              await fireNotification(
                '🔄 Cliente transferido para você!',
                `${updated.customer_name} - Ticket ${updated.ticket_number}`,
                'transferencia-cliente',
              );
            }

            queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
          },
        )
        .subscribe((status, err) => {
          console.log('[QueueAlert] Status:', status, err ?? '');

          if (status === 'SUBSCRIBED') {
            subscribedAtRef.current = Date.now();
            console.log(
              '[QueueAlert] ✅ Listening since:',
              new Date().toLocaleTimeString(),
            );
          }

          // Auto-retry on failure
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[QueueAlert] ❌ Channel error — retrying in 5 s…');
            retryTimerRef.current = setTimeout(subscribe, 5_000);
          }
        });

      channelRef.current = channel;
    };

    // Initial subscription
    subscribe();

    // ── Reconnect when tab becomes visible (critical for mobile Chrome) ─
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('[QueueAlert] 🔄 Tab visible — re-subscribing…');
        subscribe();
        // Refresh stale data
        queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
        queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ── Reconnect on network restore ────────────────────────────────────
    const onOnline = () => {
      console.log('[QueueAlert] 🌐 Back online — re-subscribing…');
      subscribe();
    };
    window.addEventListener('online', onOnline);

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [barberId, fireNotification, queryClient]);
};
