import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AttendanceRecord {
  id: string;
  queue_item_id: string | null;
  barber_id: string | null;
  service_id: string | null;
  customer_name: string;
  price_charged: number;
  payment_method: string | null;
  notes: string | null;
  completed_at: string;
}

export interface BarberWithCommission {
  id: string;
  display_name: string;
  commission_percentage: number;
}

export interface FinancialMetrics {
  totalAttendances: number;
  totalRevenue: number;
  averageTicket: number;
  totalCommissions: number;
  shopProfit: number;
  attendancesByBarber: Record<string, { 
    count: number; 
    revenue: number; 
    commission: number;
    commissionPercentage: number;
  }>;
  popularServices: { serviceId: string; count: number }[];
}

type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';

const getDateRange = (range: DateRange, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start: Date;
  let end = new Date(now);
  
  switch (range) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : new Date(now);
      end = customEnd ? new Date(customEnd) : new Date(now);
      break;
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
  }
  
  return { start: start.toISOString(), end: end.toISOString() };
};

export const useAttendanceRecords = (
  range: DateRange = 'today',
  barberId?: string,
  customStart?: string,
  customEnd?: string
) => {
  const { start, end } = getDateRange(range, customStart, customEnd);
  
  return useQuery({
    queryKey: ['attendance-records', range, barberId, customStart, customEnd],
    queryFn: async () => {
      let query = supabase
        .from('attendance_records')
        .select('*')
        .gte('completed_at', start)
        .lte('completed_at', end)
        .order('completed_at', { ascending: false });
      
      if (barberId) {
        query = query.eq('barber_id', barberId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
};

// Fetch barbers with commission info
export const useBarbersWithCommission = () => {
  return useQuery({
    queryKey: ['barbers-commission'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, display_name, commission_percentage');
      
      if (error) throw error;
      return data as BarberWithCommission[];
    },
  });
};

export const useFinancialMetrics = (
  range: DateRange = 'today',
  barberId?: string,
  customStart?: string,
  customEnd?: string
) => {
  const { data: records } = useAttendanceRecords(range, barberId, customStart, customEnd);
  const { data: barbers } = useBarbersWithCommission();
  
  const metrics: FinancialMetrics = {
    totalAttendances: 0,
    totalRevenue: 0,
    averageTicket: 0,
    totalCommissions: 0,
    shopProfit: 0,
    attendancesByBarber: {},
    popularServices: [],
  };
  
  if (records && barbers) {
    metrics.totalAttendances = records.length;
    metrics.totalRevenue = records.reduce((sum, r) => sum + Number(r.price_charged), 0);
    metrics.averageTicket = metrics.totalAttendances > 0 
      ? metrics.totalRevenue / metrics.totalAttendances 
      : 0;
    
    // Group by barber and calculate commissions
    records.forEach((record) => {
      const barberId = record.barber_id || 'unknown';
      const barber = barbers.find(b => b.id === barberId);
      const commissionPct = barber?.commission_percentage || 50;
      const priceCharged = Number(record.price_charged);
      const commission = (priceCharged * commissionPct) / 100;
      
      if (!metrics.attendancesByBarber[barberId]) {
        metrics.attendancesByBarber[barberId] = { 
          count: 0, 
          revenue: 0, 
          commission: 0,
          commissionPercentage: commissionPct,
        };
      }
      metrics.attendancesByBarber[barberId].count++;
      metrics.attendancesByBarber[barberId].revenue += priceCharged;
      metrics.attendancesByBarber[barberId].commission += commission;
      
      metrics.totalCommissions += commission;
    });
    
    metrics.shopProfit = metrics.totalRevenue - metrics.totalCommissions;
    
    // Group by service
    const serviceCounts: Record<string, number> = {};
    records.forEach((record) => {
      if (record.service_id) {
        serviceCounts[record.service_id] = (serviceCounts[record.service_id] || 0) + 1;
      }
    });
    metrics.popularServices = Object.entries(serviceCounts)
      .map(([serviceId, count]) => ({ serviceId, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  return metrics;
};
