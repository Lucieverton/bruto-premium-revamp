import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showSWNotification, ensureServiceWorker, type SWNotificationOptions } from '@/lib/pwa';

interface QueueAlertPayload {
  ticketNumber: string;
  customerName: string;
  serviceName?: string;
}

// Audio alert using Web Audio API
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
    console.log('[QueueAlert] Audio not supported');
  }
};

const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([500, 200, 500]);
  }
};

/**
 * Hook that monitors the queue in real-time and sends native PWA notifications
 * to barbers — even when the tab is in background — via Service Worker.
 */
export const useQueueAlert = (barberId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const processedIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const swReadyRef = useRef(false);

  // Pre-warm the Service Worker on mount
  useEffect(() => {
    if (!barberId) return;
    
    const warmup = async () => {
      const reg = await ensureServiceWorker();
      swReadyRef.current = !!reg?.active;
      console.log('[QueueAlert] SW pre-warmed:', swReadyRef.current);
    };
    warmup();
  }, [barberId]);

  // Fire native notification through SW
  const fireNotification = useCallback(async (alert: QueueAlertPayload) => {
    playAlertSound();
    vibrateDevice();

    // In-app toast
    toast({
      title: '💈 Novo Cliente na Fila!',
      description: `${alert.customerName} aguardando${alert.serviceName ? ` para ${alert.serviceName}` : ''}.`,
      duration: 10000,
    });

    // Native notification via Service Worker (works in background)
    const sent = await showSWNotification('💈 Novo Cliente na Fila!', {
      body: `${alert.customerName} aguardando${alert.serviceName ? ` para ${alert.serviceName}` : ''}.`,
      tag: 'novo-cliente',
    });
    
    console.log('[QueueAlert] Notification sent:', sent, 'for', alert.customerName);
  }, [toast]);

  const fireTransferNotification = useCallback(async (customerName: string, ticketNumber: string) => {
    playAlertSound();
    vibrateDevice();

    toast({
      title: '🔄 Cliente transferido para você!',
      description: `${customerName} - Ticket ${ticketNumber}`,
      duration: 10000,
    });

    await showSWNotification('🔄 Cliente Transferido!', {
      body: `${customerName} - Ticket ${ticketNumber}`,
      tag: 'transferencia-cliente',
    });
  }, [toast]);

  useEffect(() => {
    if (!barberId) return;

    console.log('[QueueAlert] Subscribing for barber:', barberId);

    const channel = supabase
      .channel(`barber-queue-alerts-${barberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'queue_items',
          filter: `barber_id=eq.${barberId}`,
        },
        async (payload) => {
          const newItem = payload.new as any;

          // Skip if already processed
          if (processedIdsRef.current.has(newItem.id)) return;
          
          // Skip initial load period
          if (initialLoadRef.current) {
            console.log('[QueueAlert] Skipping initial load item:', newItem.id);
            return;
          }

          processedIdsRef.current.add(newItem.id);
          
          // Keep set size manageable
          if (processedIdsRef.current.size > 50) {
            const entries = Array.from(processedIdsRef.current);
            processedIdsRef.current = new Set(entries.slice(-25));
          }

          // Fetch service name
          let serviceName: string | undefined;
          if (newItem.service_id) {
            const { data } = await supabase
              .from('services')
              .select('name')
              .eq('id', newItem.service_id)
              .single();
            serviceName = data?.name;
          }

          await fireNotification({
            ticketNumber: newItem.ticket_number,
            customerName: newItem.customer_name,
            serviceName,
          });

          queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
          queryClient.invalidateQueries({ queryKey: ['today-queue'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue_items',
        },
        async (payload) => {
          const updatedItem = payload.new as any;

          if (updatedItem.barber_id === barberId && payload.old?.barber_id !== barberId) {
            if (processedIdsRef.current.has(updatedItem.id)) return;
            processedIdsRef.current.add(updatedItem.id);

            await fireTransferNotification(updatedItem.customer_name, updatedItem.ticket_number);
          }

          queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
        }
      )
      .subscribe((status) => {
        console.log('[QueueAlert] Subscription status:', status);
      });

    // Allow initial load to settle before processing real events
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
      console.log('[QueueAlert] Initial load period ended, now processing events');
    }, 3000);

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [barberId, fireNotification, fireTransferNotification, queryClient]);
};
