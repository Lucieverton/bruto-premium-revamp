import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BarberQueueAlert {
  ticketNumber: string;
  customerName: string;
  serviceName?: string;
}

// Sound for notifications
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.1); // C6
    oscillator.frequency.setValueAtTime(1318.5, audioContext.currentTime + 0.2); // E6
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// Vibrate phone
const vibratePhone = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }
};

export const useBarberQueueAlerts = (barberId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastTicketRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);
  
  const showAlert = useCallback((alert: BarberQueueAlert) => {
    // Play sound
    playNotificationSound();
    
    // Vibrate
    vibratePhone();
    
    // Show toast
    toast({
      title: '🔔 Novo cliente na sua fila!',
      description: `${alert.customerName} entrou na fila${alert.serviceName ? ` - ${alert.serviceName}` : ''}`,
      duration: 10000,
    });
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Novo Cliente na Fila!', {
        body: `${alert.customerName} - Ticket ${alert.ticketNumber}${alert.serviceName ? `\nServiço: ${alert.serviceName}` : ''}`,
        icon: '/favicon.ico',
        tag: `queue-alert-${alert.ticketNumber}`,
      });
    }
  }, [toast]);
  
  useEffect(() => {
    if (!barberId) return;
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Subscribe to queue_items changes for this barber
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
          
          // Skip if it's the same ticket we already alerted
          if (lastTicketRef.current === newItem.id) return;
          
          // Skip initial load
          if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
          }
          
          lastTicketRef.current = newItem.id;
          
          // Fetch service name if exists
          let serviceName: string | undefined;
          if (newItem.service_id) {
            const { data } = await supabase
              .from('services')
              .select('name')
              .eq('id', newItem.service_id)
              .single();
            serviceName = data?.name;
          }
          
          showAlert({
            ticketNumber: newItem.ticket_number,
            customerName: newItem.customer_name,
            serviceName,
          });
          
          // Invalidate queries to refresh UI
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
        (payload) => {
          const updatedItem = payload.new as any;
          
          // If a ticket was just assigned to this barber (transfer or new assignment)
          if (updatedItem.barber_id === barberId && payload.old?.barber_id !== barberId) {
            // Skip if already alerted
            if (lastTicketRef.current === updatedItem.id) return;
            
            lastTicketRef.current = updatedItem.id;
            
            // Show transfer alert
            toast({
              title: '🔄 Cliente transferido para você!',
              description: `${updatedItem.customer_name} - Ticket ${updatedItem.ticket_number}`,
              duration: 10000,
            });
            
            playNotificationSound();
            vibratePhone();
          }
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
        }
      )
      .subscribe();
    
    // Reset initial load flag after a short delay
    setTimeout(() => {
      initialLoadRef.current = false;
    }, 2000);
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, showAlert, queryClient, toast]);
};
