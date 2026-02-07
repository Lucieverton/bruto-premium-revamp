import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendPushNotification } from '@/lib/pushNotify';

// Call next client - improved logic with validation
export const useCallClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      // First verify the ticket exists and is in waiting status
      const { data: ticket, error: fetchError } = await supabase
        .from('queue_items')
        .select('id, status, ticket_number, customer_name')
        .eq('id', ticketId)
        .single();
      
      if (fetchError) {
        throw new Error('Ticket não encontrado');
      }
      
      if (ticket.status !== 'waiting') {
        throw new Error(`Este cliente já foi ${ticket.status === 'called' ? 'chamado' : 'atendido'}`);
      }
      
      // Update the ticket status
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({ 
          status: 'called',
          is_called: true,
          called_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .eq('status', 'waiting'); // Double check status to prevent race conditions
      
      if (updateError) throw updateError;
      
      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      toast({
        title: `${ticket.ticket_number} chamado!`,
        description: `Aguardando ${ticket.customer_name}...`,
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

// Start service - uses secure RPC for better authorization
export const useStartService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ ticketId, barberId }: { ticketId: string; barberId?: string }) => {
      if (!barberId) {
        throw new Error('Selecione um barbeiro para iniciar o atendimento');
      }
      
      // Use the secure RPC function
      const { data, error } = await supabase.rpc('barber_start_service', {
        p_ticket_id: ticketId,
        p_barber_id: barberId
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
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['public-barbers'] });
      toast({
        title: 'Atendimento iniciado!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao iniciar atendimento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Complete service - uses secure RPC
export const useCompleteService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      priceCharged,
      paymentMethod,
    }: { 
      ticketId: string; 
      priceCharged: number;
      paymentMethod?: string;
      notes?: string;
    }) => {
      // Use the secure RPC function
      const { data, error } = await supabase.rpc('barber_complete_service', {
        p_ticket_id: ticketId,
        p_price_charged: priceCharged,
        p_payment_method: paymentMethod || null
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
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['public-barbers'] });
      toast({
        title: 'Atendimento finalizado!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao finalizar atendimento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Mark as no-show
export const useMarkNoShow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('queue_items')
        .update({ 
          status: 'no_show',
          completed_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      toast({
        title: 'Cliente não compareceu',
        description: 'Marcado como no-show',
      });
    },
  });
};

// Delete queue item
export const useDeleteQueueItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('queue_items')
        .delete()
        .eq('id', ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      toast({
        title: 'Cliente removido da fila',
      });
    },
  });
};

// Add walk-in client - uses secure RPC for admin (supports multiple services)
export const useAddWalkIn = () => {
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
      
      const { data: result, error } = await supabase.rpc('add_walkin_client', {
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
      queryClient.invalidateQueries({ queryKey: ['queue-item-services'] });
      toast({
        title: 'Cliente adicionado!',
        description: `Ticket: ${data.ticket_number}`,
      });

      // Push notification → assigned barber (or all if general)
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

// Toggle queue settings
export const useToggleQueueActive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const { data: existing } = await supabase
        .from('queue_settings')
        .select('id')
        .limit(1)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from('queue_settings')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('queue_settings')
          .insert({ is_active: isActive });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: ['queue-settings'] });
      toast({
        title: isActive ? 'Fila aberta!' : 'Fila fechada!',
      });
    },
  });
};
