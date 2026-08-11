import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBarberDailyEvolution, useBarberMonthComparison } from '@/hooks/useBarberEarnings';
import { CalendarDays, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface BarberDailyEvolutionCardProps {
  barberId?: string;
}

export const BarberDailyEvolutionCard = ({ barberId }: BarberDailyEvolutionCardProps) => {
  const { data: daily, isLoading } = useBarberDailyEvolution(barberId, 30);
  const { data: comparison } = useBarberMonthComparison(barberId);

  const currentCommission = comparison?.current.commission || 0;
  const previousCommission = comparison?.previous.commission || 0;
  const diff = currentCommission - previousCommission;
  const diffPct = previousCommission > 0 ? (diff / previousCommission) * 100 : 0;
  const isUp = diff >= 0;

  return (
    <Card className="bg-gradient-to-br from-card via-card to-muted/10 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          Evolução Diária (30 dias)
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBarberDaily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />

                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                    tickFormatter={(value) => `R$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    formatter={(value: number, name: string) => [
                      name === 'attendances'
                        ? `${value}`
                        : `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      name === 'commission' ? 'Meu ganho' : 'Atendimentos',
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    fill="url(#colorBarberDaily)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#22c55e', fill: 'hsl(var(--background))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Mês atual</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {currentCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {comparison?.current.attendances || 0} atendimentos
                </p>
              </div>

              <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Mês anterior</p>
                <p className="text-xl font-bold text-muted-foreground">
                  R$ {previousCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] flex items-center gap-1 ${isUp ? 'text-green-400' : 'text-destructive'}`}>
                  {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {previousCommission > 0 ? `${isUp ? '+' : ''}${diffPct.toFixed(0)}%` : 'sem comparativo'}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
