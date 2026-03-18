import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEvolutionChartData, DateRangeType, EvolutionDataPoint } from '@/hooks/useBarberEarnings';
import { TrendingUp, Loader2, Clock, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-react';

interface AnnualChartProps {
  className?: string;
  dateRange?: DateRangeType;
  customDate?: Date;
}

const CHART_CONFIG: Record<DateRangeType, { icon: React.ElementType; title: string; subtitle: string }> = {
  today: { icon: Clock, title: 'Evolução de Hoje', subtitle: 'Faturamento por hora' },
  week: { icon: CalendarDays, title: 'Evolução da Semana', subtitle: 'Segunda a Sábado' },
  month: { icon: CalendarRange, title: 'Evolução do Mês', subtitle: 'Dia a dia do mês atual' },
  year: { icon: CalendarCheck, title: `Evolução Anual ${new Date().getFullYear()}`, subtitle: 'Faturamento vs Lucro por mês' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  
  const dataPoint = payload[0]?.payload as EvolutionDataPoint;
  const breakdown = dataPoint?.barberBreakdown || {};
  const barberEntries = Object.values(breakdown);

  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-sm max-w-[250px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      <div className="space-y-1 mb-2">
        <div className="flex justify-between gap-4">
          <span className="text-green-400">Faturamento</span>
          <span className="font-semibold text-foreground">R$ {dataPoint?.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-primary">Lucro</span>
          <span className="font-semibold text-foreground">R$ {dataPoint?.shopProfit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-orange-400">Comissões</span>
          <span className="font-semibold text-foreground">R$ {dataPoint?.commission?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      {barberEntries.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold">Por barbeiro:</p>
          {barberEntries.map((b, i) => (
            <div key={i} className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground truncate">{b.name} ({b.attendances})</span>
              <span className="text-foreground font-medium">R$ {b.revenue.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AnnualChart = ({ className, dateRange = 'year', customDate }: AnnualChartProps) => {
  const { data: chartData, isLoading } = useEvolutionChartData(dateRange, customDate);
  const config = CHART_CONFIG[dateRange];
  const Icon = config.icon;
  
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-card via-card to-muted/30 border border-border rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }
  
  const totalRevenue = chartData?.reduce((sum, m) => sum + m.revenue, 0) || 0;
  const totalProfit = chartData?.reduce((sum, m) => sum + m.shopProfit, 0) || 0;
  const totalAttendances = chartData?.reduce((sum, m) => sum + m.attendances, 0) || 0;
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/20 border border-border rounded-2xl p-4 sm:p-6 ${className}`}>
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Icon size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">{config.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>
          
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Faturamento</p>
              <p className="text-lg sm:text-xl font-bold text-green-400">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lucro</p>
              <p className="text-lg sm:text-xl font-bold text-primary">
                R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cortes</p>
              <p className="text-lg sm:text-xl font-bold text-blue-400">
                {totalAttendances}
              </p>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[280px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              
              <XAxis 
                dataKey="label" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
                interval={dateRange === 'month' ? 2 : 0}
              />
              
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                width={50}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {value === 'revenue' ? 'Faturamento' : value === 'shopProfit' ? 'Lucro Barbearia' : 'Comissões'}
                  </span>
                )}
              />
              
              <Area
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#22c55e"
                strokeWidth={2.5}
                fill="url(#colorRevenue)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#22c55e', fill: 'hsl(var(--background))' }}
              />
              
              <Area
                type="monotone"
                dataKey="shopProfit"
                name="shopProfit"
                stroke="hsl(43, 96%, 56%)"
                strokeWidth={2.5}
                fill="url(#colorProfit)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(43, 96%, 56%)', fill: 'hsl(var(--background))' }}
              />
              
              <Area
                type="monotone"
                dataKey="commission"
                name="commission"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#colorCommission)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#f97316', fill: 'hsl(var(--background))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Month indicators - only show for year mode */}
        {dateRange === 'year' && chartData && (
          <div className="flex justify-between mt-4 px-2">
            {chartData.map((m, index) => {
              const currentMonth = new Date().getMonth();
              return (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index <= currentMonth 
                      ? index === currentMonth 
                        ? 'bg-primary animate-pulse scale-125' 
                        : 'bg-primary/60'
                      : 'bg-muted'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
