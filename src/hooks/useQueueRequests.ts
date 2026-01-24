import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QueueRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string | null;
  barber_id: string | null;
  priority: string;
  requested_by: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

// Hook for barbers to fetch their own requests
export const useMyQueueRequests = () => {
  return useQuery({
    queryKey: ['my-queue-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QueueRequest[];
    },
  });
};

// Hook for admins to fetch pending requests
export const usePendingQueueRequests = () => {
  return useQuery({
    queryKey: ['pending-queue-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as QueueRequest[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// Hook for barbers to create a queue request
export const useCreateQueueRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      customer_phone: string;
      service_id?: string;
      barber_id?: string;
      priority: string;
      requested_by: string;
    }) => {
      const { error } = await supabase
        .from('queue_requests')
        .insert({
          customer_name: data.customer_name.trim(),
          customer_phone: data.customer_phone.replace(/\D/g, ''),
          service_id: data.service_id || null,
          barber_id: data.barber_id || null,
          priority: data.priority,
          requested_by: data.requested_by,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-queue-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-queue-requests'] });
      toast({
        title: 'Solicitação enviada!',
        description: 'Aguarde a aprovação do administrador.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for admins to approve a request
export const useApproveQueueRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('approve_queue_request', {
        p_request_id: requestId,
        p_notes: notes || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-queue-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-queue-requests'] });
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['public-queue'] });
      toast({
        title: 'Solicitação aprovada!',
        description: 'Cliente adicionado à fila.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for admins to reject a request
export const useRejectQueueRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('reject_queue_request', {
        p_request_id: requestId,
        p_notes: notes || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-queue-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-queue-requests'] });
      toast({
        title: 'Solicitação rejeitada',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
