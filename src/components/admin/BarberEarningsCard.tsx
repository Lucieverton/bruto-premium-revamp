import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useBarberEarnings } from '@/hooks/useBarberEarnings';
import { DollarSign, TrendingUp, Calendar, Scissors, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarberEarningsCardProps {
  barberId?: string;
  barberName?: string;
  commissionPercentage?: number;
}

export const BarberEarningsCard = ({ barberId, barberName, commissionPercentage }: BarberEarningsCardProps) => {
  const { data: earnings, isLoading } = useBarberEarnings(barberId);
  
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border">
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </CardContent>
      </Card>
    );
  }
  
  if (!earnings) {
    return null;
  }
  
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border-primary/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-primary/20 rounded-lg">
              <DollarSign size={20} className="text-primary" />
            </div>
            Meus Ganhos {currentYear}
          </CardTitle>
          {commissionPercentage && (
            <p className="text-sm text-muted-foreground">
              Sua comissão: <span className="text-primary font-bold">{commissionPercentage}%</span>
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp size={14} />
                <span className="text-xs">Total Ganho</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">
                R$ {earnings.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Scissors size={14} />
                <span className="text-xs">Atendimentos</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {earnings.totalAttendances}
              </p>
            </div>
            
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign size={14} />
                <span className="text-xs">Ticket Médio</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">
                R$ {earnings.averageTicket.toFixed(0)}
              </p>
            </div>
            
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar size={14} />
                <span className="text-xs">Faturado (Total)</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-orange-400">
                R$ {earnings.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Chart Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 border-border">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-green-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={earnings.monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBarberCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="monthLabel" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  width={45}
                />
                
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    'Ganho'
                  ]}
                />
                
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  fill="url(#colorBarberCommission)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#22c55e', fill: 'hsl(var(--background))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Monthly breakdown */}
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-1">
            {earnings.monthlyData.slice(0, 12).map((month, index) => (
              <div 
                key={month.month}
                className={`text-center p-2 rounded-lg transition-all ${
                  month.commission > 0 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-muted/30'
                } ${index <= new Date().getMonth() ? 'opacity-100' : 'opacity-40'}`}
              >
                <p className="text-[10px] text-muted-foreground">{month.monthLabel}</p>
                <p className={`text-xs font-bold ${month.commission > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {month.commission > 0 ? `R$${month.commission.toFixed(0)}` : '-'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
