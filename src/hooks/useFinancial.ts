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

const PAGE_SIZE = 1000;

/**
 * Detailed attendance records. Paginated so long periods are never silently
 * truncated by the API's 1000-row cap.
 */
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
      const all: AttendanceRecord[] = [];
      let from = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        let query = supabase
          .from('attendance_records')
          .select('*')
          .gte('completed_at', start)
          .lte('completed_at', end)
          .order('completed_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (barberId) {
          query = query.eq('barber_id', barberId);
        }

        const { data, error } = await query;
        if (error) throw error;

        all.push(...((data || []) as AttendanceRecord[]));
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return all;
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

interface BarberTotalsRow {
  barber_id: string;
  barber_name: string;
  commission_percentage: number;
  revenue: number;
  commission: number;
  shop_profit: number;
  attendances: number;
}

/** Totals per barber for a period, aggregated in the database. */
export const useFinancialTotalsByBarber = (
  range: DateRange = 'today',
  customStart?: string,
  customEnd?: string
) => {
  const { start, end } = getDateRange(range, customStart, customEnd);

  return useQuery({
    queryKey: ['financial-by-barber', range, customStart, customEnd],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_financial_by_barber', {
        p_start: start,
        p_end: end,
      });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        barber_id: r.barber_id,
        barber_name: r.barber_name,
        commission_percentage: Number(r.commission_percentage) || 0,
        revenue: Number(r.revenue) || 0,
        commission: Number(r.commission) || 0,
        shop_profit: Number(r.shop_profit) || 0,
        attendances: Number(r.attendances) || 0,
      })) as BarberTotalsRow[];
    },
  });
};

export const useFinancialMetrics = (
  range: DateRange = 'today',
  barberId?: string,
  customStart?: string,
  customEnd?: string
) => {
  const { data: byBarber } = useFinancialTotalsByBarber(range, customStart, customEnd);
  const { data: records } = useAttendanceRecords(range, barberId, customStart, customEnd);
  
  const metrics: FinancialMetrics = {
    totalAttendances: 0,
    totalRevenue: 0,
    averageTicket: 0,
    totalCommissions: 0,
    shopProfit: 0,
    attendancesByBarber: {},
    popularServices: [],
  };
  
  if (byBarber) {
    const rows = barberId ? byBarber.filter((b) => b.barber_id === barberId) : byBarber;

    rows.forEach((row) => {
      metrics.attendancesByBarber[row.barber_id] = {
        count: row.attendances,
        revenue: row.revenue,
        commission: row.commission,
        commissionPercentage: row.commission_percentage,
      };
      metrics.totalAttendances += row.attendances;
      metrics.totalRevenue += row.revenue;
      metrics.totalCommissions += row.commission;
    });

    metrics.averageTicket = metrics.totalAttendances > 0
      ? metrics.totalRevenue / metrics.totalAttendances
      : 0;
    metrics.shopProfit = metrics.totalRevenue - metrics.totalCommissions;
  }

  if (records) {
    // Group by service (uses the detailed list, already paginated)
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
