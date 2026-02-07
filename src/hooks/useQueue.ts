import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { saveMyTicket } from '@/lib/antiAbuse';
import { sendPushNotification } from '@/lib/pushNotify';

export interface QueueItem {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_phone: string;
  service_id: string | null;
  barber_id: string | null;
  status: string;
  priority: string;
  origin: string;
  is_called: boolean;
  called_at: string | null;
  completed_at: string | null;
  created_at: string;
  notes: string | null;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
  is_active: boolean;
}

export interface Barber {
  id: string;
  display_name: string;
  specialty: string | null;
  is_available: boolean;
  is_active: boolean;
  avatar_url: string | null;
}

export interface QueueSettings {
  id: string;
  is_active: boolean;
  opening_time: string;
  closing_time: string;
  max_queue_size: number;
}

// Public queue item (safe for public display - no sensitive data)
export interface PublicQueueItem {
  id: string;
  ticket_number: string;
  status: string;
  priority: string;
  created_at: string;
  called_at: string | null;
  service_id: string | null;
  barber_id: string | null;
  customer_name_masked: string;
  service_name: string | null;
  barber_name: string | null;
  barber_whatsapp: string | null;
}

// Queue position result from secure RPC
export interface QueuePositionResult {
  queue_position: number;
  total_waiting: number;
  ticket_status: string;
  ticket_priority: string;
}

// Queue stats for public display
export interface QueueStats {
  waiting_count: number;
  in_progress_count: number;
  avg_wait_minutes: number;
}

// Active service for public display (masked data)
export interface ActiveServicePublic {
  id: string;
  ticket_number: string;
  service_status: string;
  priority: string;
  customer_first_name: string;
  barber_id: string | null;
  barber_name: string | null;
  service_id: string | null;
  started_at: string | null;
}

// Fetch queue items (for authenticated staff only)
export const useQueueItems = (status?: string) => {
  return useQuery({
    queryKey: ['queue-items', status],
    queryFn: async () => {
      let query = supabase
        .from('queue_items')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as QueueItem[];
    },
  });
};

// Fetch today's queue (for authenticated staff only)
export const useTodayQueue = () => {
  return useQuery({
    queryKey: ['today-queue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('queue_items')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as QueueItem[];
    },
  });
};

// Fetch public queue (safe for public display - uses secure function)
export const usePublicQueue = () => {
  return useQuery({
    queryKey: ['public-queue'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_queue');
      
      if (error) throw error;
      return data as PublicQueueItem[];
    },
  });
};

// Fetch services
export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    },
  });
};

// Public barber info (safe for public display - no user_id)
export interface PublicBarber {
  id: string;
  display_name: string;
  status: string;
  specialty: string | null;
  is_available: boolean;
  avatar_url: string | null;
}

// Fetch barbers (for authenticated staff - full data)
export const useBarbers = () => {
  return useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data as Barber[];
    },
  });
};

// Fetch public barbers (safe for public display - uses secure function)
export const usePublicBarbers = () => {
  return useQuery({
    queryKey: ['public-barbers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_barbers');
      
      if (error) throw error;
      return data as PublicBarber[];
    },
    staleTime: 0, // Always consider data stale for immediate updates
    refetchInterval: 5000, // Polling every 5 seconds for reliable sync
  });
};

// Fetch queue settings
export const useQueueSettings = () => {
  return useQuery({
    queryKey: ['queue-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as QueueSettings | null;
    },
  });
};

// Fetch single queue item by ID
export const useQueueItem = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['queue-item', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      
      const { data, error } = await supabase
        .from('queue_items')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as QueueItem;
    },
    enabled: !!ticketId,
  });
};

// Fetch queue position for a ticket (public safe - uses secure RPC)
export const useQueuePosition = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['queue-position', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      
      const { data, error } = await supabase.rpc('get_queue_position', {
        p_ticket_id: ticketId
      });
      
      if (error) throw error;
      return (data as QueuePositionResult[])?.[0] || null;
    },
    enabled: !!ticketId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};

// Fetch queue statistics (public safe - uses secure RPC)
export const useQueueStats = () => {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_queue_stats');
      
      if (error) throw error;
      return (data as QueueStats[])?.[0] || { waiting_count: 0, in_progress_count: 0, avg_wait_minutes: 20 };
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
};

// Fetch active services for public display (masked data - uses secure RPC)
export const useActiveServicesPublic = () => {
  return useQuery({
    queryKey: ['active-services-public'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_services_public');
      
      if (error) throw error;
      return data as ActiveServicePublic[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
  });
};

// Join queue mutation - uses secure RPC to bypass RLS (supports multiple services)
export const useJoinQueue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      customer_phone: string;
      service_ids?: string[]; // Changed to array
      service_id?: string; // Keep for backward compatibility
      barber_id?: string;
      priority?: string;
    }) => {
      // Support both single service_id and array of service_ids
      const serviceIds = data.service_ids || (data.service_id ? [data.service_id] : null);
      
      const { data: result, error } = await supabase.rpc('join_queue', {
        p_customer_name: data.customer_name,
        p_customer_phone: data.customer_phone,
        p_service_ids: serviceIds,
        p_barber_id: data.barber_id || null,
        p_priority: data.priority || 'normal',
      });
      
      if (error) throw error;
      
      // RPC returns array, get first item
      const ticket = Array.isArray(result) ? result[0] : result;

      // Ensure the ticket is persisted immediately (avoids race conditions with UI re-renders)
      if (ticket?.id) {
        saveMyTicket(ticket.id);
      }

      return ticket as { id: string; ticket_number: string };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['public-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-services-public'] });
      queryClient.invalidateQueries({ queryKey: ['queue-item-services'] });
      toast({
        title: 'Você entrou na fila!',
        description: `Seu ticket é ${data.ticket_number}`,
      });

      // Push notification → only the selected barber (or all if general queue)
      sendPushNotification({
        type: 'new_client',
        customer_name: variables.customer_name,
        barber_id: variables.barber_id || null,
        ticket_number: data.ticket_number,
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

// Interface for queue item service
export interface QueueItemService {
  service_id: string;
  service_name: string;
  price_at_time: number;
}

// Fetch services for a specific queue item
export const useQueueItemServices = (queueItemId: string | null) => {
  return useQuery({
    queryKey: ['queue-item-services', queueItemId],
    queryFn: async () => {
      if (!queueItemId) return [];
      
      const { data, error } = await supabase.rpc('get_queue_item_services', {
        p_queue_item_id: queueItemId
      });
      
      if (error) throw error;
      return data as QueueItemService[];
    },
    enabled: !!queueItemId,
    staleTime: 0,
  });
};

// Add service to existing queue item
export const useAddServiceToQueueItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ queueItemId, serviceId }: { queueItemId: string; serviceId: string }) => {
      const { data, error } = await supabase.rpc('add_service_to_queue_item', {
        p_queue_item_id: queueItemId,
        p_service_id: serviceId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-item-services', variables.queueItemId] });
      toast({
        title: 'Serviço adicionado!',
        description: 'O serviço foi adicionado à comanda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Remove service from queue item
export const useRemoveServiceFromQueueItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ queueItemId, serviceId }: { queueItemId: string; serviceId: string }) => {
      const { data, error } = await supabase.rpc('remove_service_from_queue_item', {
        p_queue_item_id: queueItemId,
        p_service_id: serviceId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue-item-services', variables.queueItemId] });
      toast({
        title: 'Serviço removido',
        description: 'O serviço foi removido da comanda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Leave queue mutation - uses secure RPC to bypass RLS
export const useLeaveQueue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (params: { ticketId: string; customerName?: string; barberId?: string | null; ticketNumber?: string }) => {
      const { data, error } = await supabase.rpc('leave_queue', {
        p_ticket_id: params.ticketId,
      });
      
      if (error) throw error;
      if (!data) throw new Error('Não foi possível sair da fila');
      
      return params; // pass context through for onSuccess
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['today-queue'] });
      queryClient.invalidateQueries({ queryKey: ['public-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-services-public'] });
      queryClient.invalidateQueries({ queryKey: ['queue-item'] });
      toast({
        title: 'Você saiu da fila',
        description: 'Esperamos vê-lo em breve!',
      });

      // Notify the assigned barber that the client left
      if (params.barberId) {
        sendPushNotification({
          type: 'client_left',
          customer_name: params.customerName || 'Cliente',
          barber_id: params.barberId,
          ticket_number: params.ticketNumber || '',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao sair da fila',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
