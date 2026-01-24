import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAttendanceRecords, useFinancialMetrics, useBarbersWithCommission } from '@/hooks/useFinancial';
import { useBarbers, useServices } from '@/hooks/useQueue';
import { AnnualChart } from '@/components/admin/AnnualChart';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Scissors,
  Calendar,
  PiggyBank,
  Percent,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'year';

const AdminFinanceiro = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  
  const { data: records, isLoading } = useAttendanceRecords(dateRange, selectedBarber === 'all' ? undefined : selectedBarber);
  const metrics = useFinancialMetrics(dateRange, selectedBarber === 'all' ? undefined : selectedBarber);
  const { data: barbers } = useBarbers();
  const { data: barbersWithCommission } = useBarbersWithCommission();
  const { data: services } = useServices();
  
  const rangeLabels: Record<DateRange, string> = {
    today: 'Hoje',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano',
  };
  
  // Prepare chart data with commission info
  const barberChartData = Object.entries(metrics.attendancesByBarber).map(([barberId, data]) => {
    const barber = barbers?.find(b => b.id === barberId);
    return {
      name: barber?.display_name || 'Desc.',
      atendimentos: data.count,
      faturamento: data.revenue,
      comissao: data.commission,
      lucro: data.revenue - data.commission,
    };
  });
  
  const serviceChartData = metrics.popularServices.slice(0, 5).map(({ serviceId, count }) => {
    const service = services?.find(s => s.id === serviceId);
    return {
      name: service?.name || 'Desconhecido',
      value: count,
    };
  });

  // Profit distribution pie chart
  const profitDistribution = [
    { name: 'Lucro Barbearia', value: metrics.shopProfit, color: 'hsl(43, 96%, 56%)' },
    { name: 'Comissões', value: metrics.totalCommissions, color: '#22c55e' },
  ];
  
  const COLORS = ['hsl(43, 96%, 56%)', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6'];

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    valueClass = '',
    gradient = false 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number; 
    valueClass?: string;
    gradient?: boolean;
  }) => (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-4 border transition-all hover:scale-[1.02]",
      gradient 
        ? "bg-gradient-to-br from-primary/20 via-card to-card border-primary/30" 
        : "bg-gradient-to-br from-card to-muted/20 border-border"
    )}>
      {gradient && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            gradient ? "bg-primary/20" : "bg-muted/50"
          )}>
            <Icon size={14} className={gradient ? "text-primary" : ""} />
          </div>
          <span className="text-xs truncate">{label}</span>
        </div>
        <div className={cn("text-xl sm:text-2xl font-bold truncate", valueClass)}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl uppercase">Financeiro</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe o desempenho da barbearia</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger className="w-full sm:w-[140px] bg-card/80 backdrop-blur h-9 text-sm border-border/50">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {barbers?.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex bg-card/80 backdrop-blur border border-border/50 rounded-xl overflow-hidden p-1">
              {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'rounded-lg flex-1 sm:flex-none text-xs px-3 h-7 transition-all',
                    dateRange === range 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'hover:bg-muted/50'
                  )}
                >
                  {rangeLabels[range]}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <MetricCard 
            icon={Users} 
            label="Atendimentos" 
            value={metrics.totalAttendances}
            valueClass="text-primary"
            gradient
          />
          <MetricCard 
            icon={DollarSign} 
            label="Faturamento" 
            value={`R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            valueClass="text-green-400"
          />
          <MetricCard 
            icon={Percent} 
            label="Comissões" 
            value={`R$ ${metrics.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            valueClass="text-orange-400"
          />
          <MetricCard 
            icon={PiggyBank} 
            label="Lucro" 
            value={`R$ ${metrics.shopProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            valueClass="text-primary"
            gradient
          />
          <MetricCard 
            icon={TrendingUp} 
            label="Ticket Médio" 
            value={`R$ ${metrics.averageTicket.toFixed(0)}`}
            valueClass="text-blue-400"
          />
          <MetricCard 
            icon={Calendar} 
            label="Período" 
            value={rangeLabels[dateRange]}
          />
        </div>
        
        {/* Annual Chart */}
        <AnnualChart />
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Atendimentos por Barbeiro */}
          <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 border border-border rounded-2xl p-4 sm:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base relative z-10">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Users size={14} className="text-primary" />
              </div>
              Por Barbeiro
            </h3>
            
            {barberChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barberChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    }}
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toFixed(0)}`,
                      name === 'faturamento' ? 'Faturamento' : 'Comissão'
                    ]}
                  />
                  <Bar dataKey="faturamento" name="Faturamento" fill="hsl(43, 96%, 56%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="comissao" name="Comissão" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </div>
          
          {/* Profit Distribution */}
          <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 border border-border rounded-2xl p-4 sm:p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <PiggyBank size={14} className="text-primary" />
              </div>
              Distribuição
            </h3>
            
            {metrics.totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={profitDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {profitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(0)}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </div>
          
          {/* Serviços Populares */}
          <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 border border-border rounded-2xl p-4 sm:p-6 md:col-span-2 lg:col-span-1">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Scissors size={14} className="text-primary" />
              </div>
              Serviços Top
            </h3>
            
            {serviceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px' }}
                    formatter={(value) => <span className="text-muted-foreground truncate max-w-[80px] inline-block">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </div>
        </div>
        
        {/* Commissions Table */}
        <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 border border-border rounded-2xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          
          <div className="p-4 border-b border-border/50 relative z-10">
            <h3 className="font-bold flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Percent size={16} className="text-primary" />
              </div>
              Comissões por Barbeiro
            </h3>
          </div>
          
          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Barbeiro</th>
                  <th className="p-3 text-center text-xs font-medium text-muted-foreground">%</th>
                  <th className="p-3 text-center text-xs font-medium text-muted-foreground">Atend.</th>
                  <th className="p-3 text-right text-xs font-medium text-muted-foreground">Faturado</th>
                  <th className="p-3 text-right text-xs font-medium text-muted-foreground">Comissão</th>
                  <th className="p-3 text-right text-xs font-medium text-muted-foreground">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.attendancesByBarber).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                      Nenhum atendimento no período
                    </td>
                  </tr>
                ) : (
                  Object.entries(metrics.attendancesByBarber).map(([barberId, data]) => {
                    const barber = barbers?.find(b => b.id === barberId);
                    const profit = data.revenue - data.commission;
                    
                    return (
                      <tr key={barberId} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-sm font-medium">{barber?.display_name || 'Desc.'}</td>
                        <td className="p-3 text-sm text-center text-muted-foreground">{data.commissionPercentage}%</td>
                        <td className="p-3 text-sm text-center">{data.count}</td>
                        <td className="p-3 text-sm text-right text-green-400 font-medium">
                          R$ {data.revenue.toFixed(0)}
                        </td>
                        <td className="p-3 text-sm text-right text-orange-400 font-medium">
                          R$ {data.commission.toFixed(0)}
                        </td>
                        <td className="p-3 text-sm text-right text-primary font-bold">
                          R$ {profit.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {Object.entries(metrics.attendancesByBarber).length > 0 && (
                <tfoot>
                  <tr className="bg-primary/10">
                    <td className="p-3 text-sm font-bold">TOTAL</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-sm text-center font-bold">{metrics.totalAttendances}</td>
                    <td className="p-3 text-sm text-right text-green-400 font-bold">
                      R$ {metrics.totalRevenue.toFixed(0)}
                    </td>
                    <td className="p-3 text-sm text-right text-orange-400 font-bold">
                      R$ {metrics.totalCommissions.toFixed(0)}
                    </td>
                    <td className="p-3 text-sm text-right text-primary font-bold">
                      R$ {metrics.shopProfit.toFixed(0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        
        {/* Attendance History */}
        <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 border border-border rounded-2xl">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-bold flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Calendar size={16} className="text-primary" />
              </div>
              Histórico de Atendimentos
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Data</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Barbeiro</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Serviço</th>
                  <th className="p-3 text-right text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Pag.</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : records?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                      Nenhum atendimento encontrado
                    </td>
                  </tr>
                ) : (
                  records?.slice(0, 15).map((record) => {
                    const barber = barbers?.find(b => b.id === record.barber_id);
                    const service = services?.find(s => s.id === record.service_id);
                    const date = new Date(record.completed_at);
                    
                    return (
                      <tr key={record.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground">
                          {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-sm">{record.customer_name}</td>
                        <td className="p-3 text-sm">{barber?.display_name || '-'}</td>
                        <td className="p-3 text-xs text-muted-foreground truncate max-w-[100px]">{service?.name || '-'}</td>
                        <td className="p-3 text-sm text-right text-green-400 font-medium">
                          R$ {Number(record.price_charged).toFixed(0)}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground capitalize">
                          {record.payment_method || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
