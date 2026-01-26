import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminBarber {
  id: string;
  display_name: string;
  specialty: string | null;
  is_available: boolean;
  is_active: boolean;
  avatar_url: string | null;
  status: string;
  commission_percentage: number;
  user_id: string | null;
  can_add_clients_directly: boolean;
}

// Fetch all barbers for admin operations (requires authentication)
export const useAdminBarbers = () => {
  return useQuery({
    queryKey: ['admin-barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data as AdminBarber[];
    },
    staleTime: 30000, // Consider fresh for 30 seconds
  });
};

// Fetch available barbers for admin dropdown (only those who can receive clients)
export const useAvailableBarbers = () => {
  return useQuery({
    queryKey: ['available-barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, display_name, is_available, status, avatar_url')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10000,
  });
};
