import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { saveMyTicket } from '@/lib/antiAbuse';
import { sendPushNotification } from '@/lib/pushNotify';

interface CompanionInput {
  name: string;
  service_ids: string[];
  barber_id: string;
}

export const useJoinQueueGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      customer_phone: string;
      service_ids: string[];
      barber_id: string;
      priority: string;
      companions: CompanionInput[];
    }) => {
      const companionsJson = data.companions.map(c => ({
        name: c.name,
        service_ids: JSON.stringify(c.service_ids),
        barber_id: c.barber_id || '',
      }));

      const { data: result, error } = await supabase.rpc('join_queue_group' as any, {
        p_customer_name: data.customer_name,
        p_customer_phone: data.customer_phone,
        p_service_ids: data.service_ids,
        p_barber_id: data.barber_id,
        p_priority: data.priority,
        p_companions: JSON.stringify(companionsJson),
      });

      if (error) throw error;

      const tickets = Array.isArray(result) ? result : [result];
      // Save leader ticket
      if (tickets[0]?.id) {
        saveMyTicket(tickets[0].id);
      }

      return tickets as Array<{ id: string; ticket_number: string; group_id: string | null }>;
    },
    onSuccess: (tickets, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['public-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-services-public'] });
      queryClient.invalidateQueries({ queryKey: ['queue-item-services'] });

      const ticketNumbers = tickets.map(t => t.ticket_number).join(', ');
      toast({
        title: `${tickets.length} pessoa(s) na fila!`,
        description: `Tickets: ${ticketNumbers}`,
      });

      sendPushNotification({
        type: 'new_client',
        customer_name: `${variables.customer_name} (+${variables.companions.length} acompanhante${variables.companions.length > 1 ? 's' : ''})`,
        barber_id: variables.barber_id || null,
        ticket_number: tickets[0]?.ticket_number || '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao entrar na fila',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
