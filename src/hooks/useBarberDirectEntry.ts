import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendPushNotification } from '@/lib/pushNotify';

// Hook for barbers with direct entry permission to add clients directly (supports multiple services)
export const useBarberDirectEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      customer_phone: string;
      service_ids?: string[]; // Array of service IDs
      service_id?: string; // Keep for backward compatibility
      barber_id?: string;
      priority?: string;
    }) => {
      // Support both single service_id and array of service_ids
      const serviceIds = data.service_ids || (data.service_id ? [data.service_id] : null);
      
      const { data: result, error } = await supabase.rpc('barber_add_client_direct', {
        p_customer_name: data.customer_name,
        p_customer_phone: data.customer_phone,
        p_service_ids: serviceIds,
        p_barber_id: data.barber_id || null,
        p_priority: data.priority || 'normal',
      });
      
      if (error) throw error;
      
      // RPC returns array, get first item
      const ticket = Array.isArray(result) ? result[0] : result;
      return ticket as { id: string; ticket_number: string };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['public-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-item-services'] });
      toast({
        title: 'Cliente adicionado na fila!',
        description: `Ticket: ${data.ticket_number}`,
      });

      // Push only to assigned barber (if different from the one adding)
      sendPushNotification({
        type: 'new_client',
        customer_name: variables.customer_name,
        barber_id: variables.barber_id || null,
        ticket_number: data.ticket_number,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for barbers to call a client without starting service
export const useBarberCallClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ ticketId, barberId }: { ticketId: string; barberId: string }) => {
      const { data, error } = await supabase.rpc('barber_call_client', {
        p_ticket_id: ticketId,
        p_barber_id: barberId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['barber-queue'] });
      queryClient.invalidateQueries({ queryKey: ['public-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-services-public'] });
      toast({
        title: 'Cliente chamado!',
        description: 'Aguardando o cliente chegar.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao chamar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
