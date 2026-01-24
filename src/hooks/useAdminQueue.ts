import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

// Start service
export const useStartService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ ticketId, barberId }: { ticketId: string; barberId?: string }) => {
      const { error } = await supabase
        .from('queue_items')
        .update({ 
          status: 'in_progress',
          barber_id: barberId || null,
        })
        .eq('id', ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      toast({
        title: 'Atendimento iniciado!',
      });
    },
  });
};

// Complete service
export const useCompleteService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      priceCharged,
      paymentMethod,
      notes,
    }: { 
      ticketId: string; 
      priceCharged: number;
      paymentMethod?: string;
      notes?: string;
    }) => {
      // First get the queue item details
      const { data: queueItem, error: fetchError } = await supabase
        .from('queue_items')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update queue item status
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
      
      if (updateError) throw updateError;
      
      // Create attendance record
      const { error: recordError } = await supabase
        .from('attendance_records')
        .insert({
          queue_item_id: ticketId,
          barber_id: queueItem.barber_id,
          service_id: queueItem.service_id,
          customer_name: queueItem.customer_name,
          price_charged: priceCharged,
          payment_method: paymentMethod || null,
          notes: notes || null,
        });
      
      if (recordError) throw recordError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast({
        title: 'Atendimento finalizado!',
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

// Add walk-in client
export const useAddWalkIn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      customer_phone: string;
      service_id?: string;
      barber_id?: string;
      priority?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('queue_items')
        .insert([{
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          service_id: data.service_id || null,
          barber_id: data.barber_id || null,
          priority: data.priority || 'normal',
          origin: 'presencial',
          status: 'waiting',
          ticket_number: '', // Will be generated by trigger
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      toast({
        title: 'Cliente adicionado!',
        description: `Ticket: ${data.ticket_number}`,
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
