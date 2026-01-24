import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BarberEarning {
  month: string;
  monthLabel: string;
  revenue: number;
  commission: number;
  attendances: number;
}

export interface BarberTotalEarnings {
  totalRevenue: number;
  totalCommission: number;
  totalAttendances: number;
  averageTicket: number;
  monthlyData: BarberEarning[];
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const useBarberEarnings = (barberId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['barber-earnings', barberId || user?.id],
    queryFn: async () => {
      if (!barberId && !user?.id) return null;
      
      // First get the barber ID if we only have user ID
      let targetBarberId = barberId;
      if (!targetBarberId && user?.id) {
        const { data: barberData } = await supabase
          .from('barbers')
          .select('id, commission_percentage')
          .eq('user_id', user.id)
          .single();
        
        if (!barberData) return null;
        targetBarberId = barberData.id;
      }
      
      // Get barber commission percentage
      const { data: barber } = await supabase
        .from('barbers')
        .select('commission_percentage')
        .eq('id', targetBarberId)
        .single();
      
      const commissionPct = barber?.commission_percentage || 50;
      
      // Get current year's data
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();
      
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('barber_id', targetBarberId)
        .gte('completed_at', startOfYear)
        .lte('completed_at', endOfYear)
        .order('completed_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const monthlyMap: Record<number, { revenue: number; commission: number; attendances: number }> = {};
      
      // Initialize all months
      for (let i = 0; i < 12; i++) {
        monthlyMap[i] = { revenue: 0, commission: 0, attendances: 0 };
      }
      
      let totalRevenue = 0;
      let totalCommission = 0;
      let totalAttendances = 0;
      
      records?.forEach((record) => {
        const date = new Date(record.completed_at);
        const month = date.getMonth();
        const price = Number(record.price_charged);
        const commission = (price * commissionPct) / 100;
        
        monthlyMap[month].revenue += price;
        monthlyMap[month].commission += commission;
        monthlyMap[month].attendances += 1;
        
        totalRevenue += price;
        totalCommission += commission;
        totalAttendances += 1;
      });
      
      const monthlyData: BarberEarning[] = Object.entries(monthlyMap).map(([monthIndex, data]) => ({
        month: String(parseInt(monthIndex) + 1).padStart(2, '0'),
        monthLabel: MONTHS[parseInt(monthIndex)],
        revenue: data.revenue,
        commission: data.commission,
        attendances: data.attendances,
      }));
      
      return {
        totalRevenue,
        totalCommission,
        totalAttendances,
        averageTicket: totalAttendances > 0 ? totalRevenue / totalAttendances : 0,
        monthlyData,
      } as BarberTotalEarnings;
    },
    enabled: !!(barberId || user?.id),
  });
};

// Hook for admin to get all barbers annual data
export const useAllBarbersAnnualData = () => {
  return useQuery({
    queryKey: ['all-barbers-annual'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();
      
      // Get all attendance records for the year
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('completed_at', startOfYear)
        .lte('completed_at', endOfYear)
        .order('completed_at', { ascending: true });
      
      if (error) throw error;
      
      // Get all barbers with commission
      const { data: barbers } = await supabase
        .from('barbers')
        .select('id, display_name, commission_percentage');
      
      const barberMap = new Map(barbers?.map(b => [b.id, b]) || []);
      
      // Group by month
      const monthlyData: { 
        month: string; 
        monthLabel: string;
        revenue: number; 
        commission: number;
        shopProfit: number;
        attendances: number;
      }[] = [];
      
      for (let i = 0; i < 12; i++) {
        monthlyData.push({
          month: String(i + 1).padStart(2, '0'),
          monthLabel: MONTHS[i],
          revenue: 0,
          commission: 0,
          shopProfit: 0,
          attendances: 0,
        });
      }
      
      records?.forEach((record) => {
        const date = new Date(record.completed_at);
        const month = date.getMonth();
        const price = Number(record.price_charged);
        const barber = barberMap.get(record.barber_id || '');
        const commissionPct = barber?.commission_percentage || 50;
        const commission = (price * commissionPct) / 100;
        
        monthlyData[month].revenue += price;
        monthlyData[month].commission += commission;
        monthlyData[month].shopProfit += price - commission;
        monthlyData[month].attendances += 1;
      });
      
      return monthlyData;
    },
  });
};
