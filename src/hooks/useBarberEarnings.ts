import { shopDayStart, shopDayEnd } from '@/lib/businessDay';
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

export interface FinancialSeriesPoint {
  bucketStart: string;
  revenue: number;
  commission: number;
  shopProfit: number;
  attendances: number;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type Bucket = 'hour' | 'day' | 'month';

/** Aggregated series straight from the database (no 1000-row limit). */
export const fetchFinancialSeries = async (
  start: Date,
  end: Date,
  bucket: Bucket,
  barberId?: string | null
): Promise<FinancialSeriesPoint[]> => {
  const { data, error } = await supabase.rpc('get_financial_series', {
    p_start: start.toISOString(),
    p_end: end.toISOString(),
    p_bucket: bucket,
    p_barber_id: barberId ?? null,
  });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    bucketStart: r.bucket_start as string,
    revenue: Number(r.revenue) || 0,
    commission: Number(r.commission) || 0,
    shopProfit: Number(r.shop_profit) || 0,
    attendances: Number(r.attendances) || 0,
  }));
};

const startOfYear = (year: number) => new Date(year, 0, 1, 0, 0, 0, 0);
const endOfYear = (year: number) => new Date(year, 11, 31, 23, 59, 59, 999);

/** Barber's own yearly earnings, aggregated in the database. */
export const useBarberEarnings = (barberId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['barber-earnings', barberId || user?.id],
    queryFn: async () => {
      if (!barberId && !user?.id) return null;

      let targetBarberId = barberId;
      if (!targetBarberId && user?.id) {
        const { data: barberData } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!barberData) return null;
        targetBarberId = barberData.id;
      }

      const currentYear = new Date().getFullYear();
      const series = await fetchFinancialSeries(
        startOfYear(currentYear),
        endOfYear(currentYear),
        'month',
        targetBarberId
      );

      const monthlyMap: Record<number, { revenue: number; commission: number; attendances: number }> = {};
      for (let i = 0; i < 12; i++) monthlyMap[i] = { revenue: 0, commission: 0, attendances: 0 };

      let totalRevenue = 0;
      let totalCommission = 0;
      let totalAttendances = 0;

      series.forEach((point) => {
        const month = new Date(point.bucketStart).getMonth();
        if (monthlyMap[month]) {
          monthlyMap[month].revenue += point.revenue;
          monthlyMap[month].commission += point.commission;
          monthlyMap[month].attendances += point.attendances;
        }
        totalRevenue += point.revenue;
        totalCommission += point.commission;
        totalAttendances += point.attendances;
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

/** Admin: annual totals per month across the whole shop. */
export const useAllBarbersAnnualData = () => {
  return useQuery({
    queryKey: ['all-barbers-annual'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const series = await fetchFinancialSeries(
        startOfYear(currentYear),
        endOfYear(currentYear),
        'month',
        null
      );

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: String(i + 1).padStart(2, '0'),
        monthLabel: MONTHS[i],
        revenue: 0,
        commission: 0,
        shopProfit: 0,
        attendances: 0,
      }));

      series.forEach((point) => {
        const month = new Date(point.bucketStart).getMonth();
        if (!monthlyData[month]) return;
        monthlyData[month].revenue += point.revenue;
        monthlyData[month].commission += point.commission;
        monthlyData[month].shopProfit += point.shopProfit;
        monthlyData[month].attendances += point.attendances;
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

const rangeBounds = (dateRange: DateRangeType, now: Date) => {
  switch (dateRange) {
    case 'today':
      return {
        startDate: shopDayStart(now),
        endDate: shopDayEnd(now),
        bucket: 'hour' as Bucket,
      };
    case 'week': {
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      return {
        startDate: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0),
        endDate: new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate(), 23, 59, 59),
        bucket: 'day' as Bucket,
      };
    }
    case 'month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        bucket: 'day' as Bucket,
      };
    case 'year':
    default:
      return {
        startDate: startOfYear(now.getFullYear()),
        endDate: endOfYear(now.getFullYear()),
        bucket: 'month' as Bucket,
      };
  }
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const pointLabel = (date: Date, dateRange: DateRangeType) => {
  switch (dateRange) {
    case 'today':
      return `${date.getHours()}h`;
    case 'week':
      return WEEKDAY_LABELS[date.getDay()];
    case 'month':
      return String(date.getDate()).padStart(2, '0');
    default:
      return MONTHS[date.getMonth()];
  }
};

/**
 * Evolution chart data. Aggregated server-side per bucket, plus a per-barber
 * breakdown built from one aggregated series per barber.
 */
export const useEvolutionChartData = (dateRange: DateRangeType, customDate?: Date) => {
  return useQuery({
    queryKey: ['evolution-chart', dateRange, customDate?.toISOString()],
    queryFn: async () => {
      const now = customDate || new Date();
      const { startDate, endDate, bucket } = rangeBounds(dateRange, now);

      const { data: barbers } = await supabase
        .from('barbers')
        .select('id, display_name');

      const barberList = barbers || [];

      const [totalSeries, ...barberSeries] = await Promise.all([
        fetchFinancialSeries(startDate, endDate, bucket, null),
        ...barberList.map((b) => fetchFinancialSeries(startDate, endDate, bucket, b.id)),
      ]);

      const dataPoints: EvolutionDataPoint[] = totalSeries.map((point) => ({
        label: pointLabel(new Date(point.bucketStart), dateRange),
        revenue: point.revenue,
        commission: point.commission,
        shopProfit: point.shopProfit,
        attendances: point.attendances,
        barberBreakdown: {},
      }));

      barberSeries.forEach((series, barberIdx) => {
        const barber = barberList[barberIdx];
        series.forEach((point, i) => {
          if (!dataPoints[i] || point.attendances === 0) return;
          dataPoints[i].barberBreakdown[barber.id] = {
            name: barber.display_name || 'Desc.',
            revenue: point.revenue,
            commission: point.commission,
            attendances: point.attendances,
          };
        });
      });

      return dataPoints;
    },
  });
};

/** Per-day evolution for a single barber over an arbitrary window. */
export const useBarberDailyEvolution = (barberId?: string, days: number = 30) => {
  return useQuery({
    queryKey: ['barber-daily-evolution', barberId, days],
    queryFn: async () => {
      if (!barberId) return [];
      const end = shopDayEnd();
      const start = shopDayStart(new Date(end.getTime() - (days - 1) * 86400000));

      const series = await fetchFinancialSeries(start, end, 'day', barberId);

      return series.map((point) => {
        const d = new Date(point.bucketStart);
        return {
          ...point,
          label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          date: d,
        };
      });
    },
    enabled: !!barberId,
  });
};

/** Month totals for a barber (current month and previous month). */
export const useBarberMonthComparison = (barberId?: string) => {
  return useQuery({
    queryKey: ['barber-month-comparison', barberId],
    queryFn: async () => {
      if (!barberId) return null;
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const series = await fetchFinancialSeries(start, end, 'month', barberId);

      const empty = { revenue: 0, commission: 0, attendances: 0 };
      const bucketFor = (year: number, month: number) => {
        const found = series.find((p) => {
          const d = new Date(p.bucketStart);
          return d.getFullYear() === year && d.getMonth() === month;
        });
        return found
          ? { revenue: found.revenue, commission: found.commission, attendances: found.attendances }
          : empty;
      };

      const current = bucketFor(now.getFullYear(), now.getMonth());
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previous = bucketFor(prevDate.getFullYear(), prevDate.getMonth());

      return { current, previous };
    },
    enabled: !!barberId,
  });
};
