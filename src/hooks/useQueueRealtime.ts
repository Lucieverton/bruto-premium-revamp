import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { notifyUserCalled } from '@/lib/notifications';
import { getMyTicket } from '@/lib/antiAbuse';

export const useQueueRealtime = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_items',
        },
        (payload) => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['queue-items'] });
          queryClient.invalidateQueries({ queryKey: ['today-queue'] });
          
          // Check if current user's ticket was called
          const myTicketId = getMyTicket();
          if (myTicketId && payload.eventType === 'UPDATE') {
            const newData = payload.new as { id: string; status: string; ticket_number: string; is_called: boolean };
            if (newData.id === myTicketId && newData.is_called && newData.status === 'called') {
              notifyUserCalled(newData.ticket_number);
            }
          }
          
          // Also invalidate single ticket query
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            const itemId = (payload.old as { id?: string })?.id || (payload.new as { id?: string })?.id;
            if (itemId) {
              queryClient.invalidateQueries({ queryKey: ['queue-item', itemId] });
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

export const useQueueSettingsRealtime = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_settings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['queue-settings'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
