import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BarberQueueItem {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  priority: string;
  service_id: string | null;
  called_at: string | null;
  created_at: string;
}

// Fetch barber's current queue items
export const useBarberQueue = (barberId: string | null) => {
  return useQuery({
    queryKey: ['barber-queue', barberId],
    queryFn: async () => {
      if (!barberId) return [];
      
      const { data, error } = await supabase.rpc('get_barber_queue', {
        p_barber_id: barberId
      });
      
      if (error) throw error;
      return data as BarberQueueItem[];
    },
    enabled: !!barberId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

// Barber start service using secure RPC
export const useBarberStartService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ ticketId, barberId }: { ticketId: string; barberId: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['public-barbers'] });
      toast({
        title: 'Atendimento iniciado!',
        description: 'Cliente está sendo atendido.',
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

// Barber complete service using secure RPC
export const useBarberCompleteService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      priceCharged, 
      paymentMethod,
      services
    }: { 
      ticketId: string; 
      priceCharged: number;
      paymentMethod?: string;
      services?: Array<{ service_id: string; service_name: string; price_charged: number }>;
    }) => {
      // p_services must be sent as a native JS array/object, NOT a stringified JSON
      const { data, error } = await supabase.rpc('barber_complete_service', {
        p_ticket_id: ticketId,
        p_price_charged: priceCharged,
        p_payment_method: paymentMethod || null,
        p_services: services && services.length > 0 ? services : null
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
      queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['public-barbers'] });
      queryClient.invalidateQueries({ queryKey: ['queue-item-services'] });
      toast({
        title: 'Atendimento finalizado!',
        description: 'Registrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao finalizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Update barber status using secure RPC
export const useUpdateBarberStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      barberId, 
      status, 
      isAvailable 
    }: { 
      barberId: string; 
      status: 'online' | 'away' | 'offline';
      isAvailable: boolean;
    }) => {
      const { data, error } = await supabase.rpc('update_barber_status', {
        p_barber_id: barberId,
        p_status: status,
        p_is_available: isAvailable
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['public-barbers'] });
      
      const statusMessages: Record<string, string> = {
        online: 'Você está disponível para atendimentos',
        away: 'Você está ocupado',
        offline: 'Você está offline',
      };
      
      toast({
        title: 'Status atualizado!',
        description: statusMessages[variables.status] || 'Status alterado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
