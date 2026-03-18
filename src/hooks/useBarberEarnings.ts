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
      
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('completed_at', startOfYear)
        .lte('completed_at', endOfYear)
        .order('completed_at', { ascending: true });
      
      if (error) throw error;
      
      const { data: barbers } = await supabase
        .from('barbers')
        .select('id, display_name, commission_percentage');
      
      const barberMap = new Map(barbers?.map(b => [b.id, b]) || []);
      
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

export type DateRangeType = 'today' | 'week' | 'month' | 'year';

export interface EvolutionDataPoint {
  label: string;
  revenue: number;
  commission: number;
  shopProfit: number;
  attendances: number;
  barberBreakdown: Record<string, { name: string; revenue: number; commission: number; attendances: number }>;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const useEvolutionChartData = (dateRange: DateRangeType, customDate?: Date) => {
  return useQuery({
    queryKey: ['evolution-chart', dateRange, customDate?.toISOString()],
    queryFn: async () => {
      const now = customDate || new Date();
      let startDate: Date;
      let endDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week': {
          const dayOfWeek = now.getDay();
          const monday = new Date(now);
          monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
          startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0);
          const saturday = new Date(monday);
          saturday.setDate(monday.getDate() + 5);
          endDate = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate(), 23, 59, 59);
          break;
        }
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
        default:
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
      }

      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: true });

      if (error) throw error;

      const { data: barbers } = await supabase
        .from('barbers')
        .select('id, display_name, commission_percentage');

      const barberMap = new Map(barbers?.map(b => [b.id, b]) || []);

      // Build data points based on mode
      let dataPoints: EvolutionDataPoint[] = [];

      if (dateRange === 'today') {
        // Group by hour (8h - 20h)
        for (let h = 8; h <= 20; h++) {
          dataPoints.push({
            label: `${h}h`,
            revenue: 0, commission: 0, shopProfit: 0, attendances: 0,
            barberBreakdown: {},
          });
        }
        records?.forEach((r) => {
          const hour = new Date(r.completed_at).getHours();
          const idx = hour - 8;
          if (idx >= 0 && idx < dataPoints.length) {
            const price = Number(r.price_charged);
            const barber = barberMap.get(r.barber_id || '');
            const commPct = barber?.commission_percentage || 50;
            const comm = (price * commPct) / 100;
            dataPoints[idx].revenue += price;
            dataPoints[idx].commission += comm;
            dataPoints[idx].shopProfit += price - comm;
            dataPoints[idx].attendances += 1;
            // Barber breakdown
            const bid = r.barber_id || 'unknown';
            if (!dataPoints[idx].barberBreakdown[bid]) {
              dataPoints[idx].barberBreakdown[bid] = { name: barber?.display_name || 'Desc.', revenue: 0, commission: 0, attendances: 0 };
            }
            dataPoints[idx].barberBreakdown[bid].revenue += price;
            dataPoints[idx].barberBreakdown[bid].commission += comm;
            dataPoints[idx].barberBreakdown[bid].attendances += 1;
          }
        });
      } else if (dateRange === 'week') {
        // Mon-Sat (indexes 1-6 in JS weekday)
        const weekLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        for (let i = 0; i < 6; i++) {
          dataPoints.push({
            label: weekLabels[i],
            revenue: 0, commission: 0, shopProfit: 0, attendances: 0,
            barberBreakdown: {},
          });
        }
        records?.forEach((r) => {
          const d = new Date(r.completed_at);
          let dayIdx = d.getDay() - 1; // Mon=0, Tue=1...Sat=5
          if (dayIdx < 0) dayIdx = 6; // Sunday -> skip or map
          if (dayIdx >= 0 && dayIdx < 6) {
            const price = Number(r.price_charged);
            const barber = barberMap.get(r.barber_id || '');
            const commPct = barber?.commission_percentage || 50;
            const comm = (price * commPct) / 100;
            dataPoints[dayIdx].revenue += price;
            dataPoints[dayIdx].commission += comm;
            dataPoints[dayIdx].shopProfit += price - comm;
            dataPoints[dayIdx].attendances += 1;
            const bid = r.barber_id || 'unknown';
            if (!dataPoints[dayIdx].barberBreakdown[bid]) {
              dataPoints[dayIdx].barberBreakdown[bid] = { name: barber?.display_name || 'Desc.', revenue: 0, commission: 0, attendances: 0 };
            }
            dataPoints[dayIdx].barberBreakdown[bid].revenue += price;
            dataPoints[dayIdx].barberBreakdown[bid].commission += comm;
            dataPoints[dayIdx].barberBreakdown[bid].attendances += 1;
          }
        });
      } else if (dateRange === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          dataPoints.push({
            label: String(d).padStart(2, '0'),
            revenue: 0, commission: 0, shopProfit: 0, attendances: 0,
            barberBreakdown: {},
          });
        }
        records?.forEach((r) => {
          const day = new Date(r.completed_at).getDate() - 1;
          if (day >= 0 && day < dataPoints.length) {
            const price = Number(r.price_charged);
            const barber = barberMap.get(r.barber_id || '');
            const commPct = barber?.commission_percentage || 50;
            const comm = (price * commPct) / 100;
            dataPoints[day].revenue += price;
            dataPoints[day].commission += comm;
            dataPoints[day].shopProfit += price - comm;
            dataPoints[day].attendances += 1;
            const bid = r.barber_id || 'unknown';
            if (!dataPoints[day].barberBreakdown[bid]) {
              dataPoints[day].barberBreakdown[bid] = { name: barber?.display_name || 'Desc.', revenue: 0, commission: 0, attendances: 0 };
            }
            dataPoints[day].barberBreakdown[bid].revenue += price;
            dataPoints[day].barberBreakdown[bid].commission += comm;
            dataPoints[day].barberBreakdown[bid].attendances += 1;
          }
        });
      } else {
        // Year - group by month
        for (let i = 0; i < 12; i++) {
          dataPoints.push({
            label: MONTHS[i],
            revenue: 0, commission: 0, shopProfit: 0, attendances: 0,
            barberBreakdown: {},
          });
        }
        records?.forEach((r) => {
          const month = new Date(r.completed_at).getMonth();
          const price = Number(r.price_charged);
          const barber = barberMap.get(r.barber_id || '');
          const commPct = barber?.commission_percentage || 50;
          const comm = (price * commPct) / 100;
          dataPoints[month].revenue += price;
          dataPoints[month].commission += comm;
          dataPoints[month].shopProfit += price - comm;
          dataPoints[month].attendances += 1;
          const bid = r.barber_id || 'unknown';
          if (!dataPoints[month].barberBreakdown[bid]) {
            dataPoints[month].barberBreakdown[bid] = { name: barber?.display_name || 'Desc.', revenue: 0, commission: 0, attendances: 0 };
          }
          dataPoints[month].barberBreakdown[bid].revenue += price;
          dataPoints[month].barberBreakdown[bid].commission += comm;
          dataPoints[month].barberBreakdown[bid].attendances += 1;
        });
      }

      return dataPoints;
    },
  });
};
