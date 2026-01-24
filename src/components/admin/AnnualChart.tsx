import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAllBarbersAnnualData } from '@/hooks/useBarberEarnings';
import { TrendingUp, Loader2 } from 'lucide-react';

interface AnnualChartProps {
  className?: string;
}

export const AnnualChart = ({ className }: AnnualChartProps) => {
  const { data: monthlyData, isLoading } = useAllBarbersAnnualData();
  
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-card via-card to-muted/30 border border-border rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }
  
  const currentMonth = new Date().getMonth();
  const totalRevenue = monthlyData?.reduce((sum, m) => sum + m.revenue, 0) || 0;
  const totalProfit = monthlyData?.reduce((sum, m) => sum + m.shopProfit, 0) || 0;
  
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
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Evolução Anual {new Date().getFullYear()}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Faturamento vs Lucro por mês</p>
            </div>
          </div>
          
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Faturamento Total</p>
              <p className="text-lg sm:text-xl font-bold text-green-400">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lucro Total</p>
              <p className="text-lg sm:text-xl font-bold text-primary">
                R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[280px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyData}
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
                dataKey="monthLabel" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                width={50}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  name === 'revenue' ? 'Faturamento' : name === 'shopProfit' ? 'Lucro' : 'Comissões'
                ]}
              />
              
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
        
        {/* Month indicators */}
        <div className="flex justify-between mt-4 px-2">
          {monthlyData?.map((m, index) => (
            <div 
              key={m.month}
              className={`w-2 h-2 rounded-full transition-all ${
                index <= currentMonth 
                  ? index === currentMonth 
                    ? 'bg-primary animate-pulse scale-125' 
                    : 'bg-primary/60'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
