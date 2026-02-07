import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendPushNotification } from '@/lib/pushNotify';

export interface QueueTransfer {
  id: string;
  queue_item_id: string;
  from_barber_id: string | null;
  to_barber_id: string;
  reason: string | null;
  status: string;
  created_at: string;
}

// Hook for fetching transfers (for both barbers and admins)
export const useQueueTransfers = (barberId?: string) => {
  return useQuery({
    queryKey: ['queue-transfers', barberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as QueueTransfer[];
    },
    enabled: !!barberId,
  });
};

// Hook for transferring a client
export const useTransferClient = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      queueItemId, 
      toBarberId, 
      reason 
    }: { 
      queueItemId: string; 
      toBarberId: string; 
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc('transfer_queue_client', {
        p_queue_item_id: queueItemId,
        p_to_barber_id: toBarberId,
        p_reason: reason || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['public-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
      toast({
        title: 'Cliente transferido!',
        description: 'O cliente foi transferido para outro barbeiro.',
      });

      // Fire-and-forget push notification to the target barber
      sendPushNotification({
        type: 'transfer',
        customer_name: 'Cliente transferido',
        barber_id: variables.toBarberId,
        ticket_number: variables.queueItemId,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao transferir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
