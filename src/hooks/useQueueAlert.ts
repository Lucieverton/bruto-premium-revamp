import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showSWNotification, requestPushPermission, type SWNotificationOptions } from '@/lib/pwa';

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
    console.log('Audio not supported');
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
  const lastTicketRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);

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
    await showSWNotification('💈 Novo Cliente na Fila!', {
      body: `${alert.customerName} aguardando${alert.serviceName ? ` para ${alert.serviceName}` : ''}.`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [500, 200, 500],
      tag: 'novo-cliente',
      renotify: true,
      requireInteraction: true,
    });
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
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [500, 200, 500],
      tag: 'transferencia-cliente',
      renotify: true,
    });
  }, [toast]);

  useEffect(() => {
    if (!barberId) return;

    // Request notification permission on mount
    requestPushPermission();

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

          if (lastTicketRef.current === newItem.id) return;
          if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
          }

          lastTicketRef.current = newItem.id;

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
            if (lastTicketRef.current === updatedItem.id) return;
            lastTicketRef.current = updatedItem.id;

            await fireTransferNotification(updatedItem.customer_name, updatedItem.ticket_number);
          }

          queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
        }
      )
      .subscribe();

    setTimeout(() => {
      initialLoadRef.current = false;
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, fireNotification, fireTransferNotification, queryClient]);
};
