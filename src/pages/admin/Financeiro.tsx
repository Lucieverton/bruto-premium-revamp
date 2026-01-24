import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAttendanceRecords, useFinancialMetrics, useBarbersWithCommission } from '@/hooks/useFinancial';
import { useBarbers, useServices } from '@/hooks/useQueue';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Scissors,
  Calendar,
  PiggyBank,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
    week: 'Esta Semana',
    month: 'Este Mês',
    year: 'Este Ano',
  };
  
  // Prepare chart data with commission info
  const barberChartData = Object.entries(metrics.attendancesByBarber).map(([barberId, data]) => {
    const barber = barbers?.find(b => b.id === barberId);
    return {
      name: barber?.display_name || 'Desconhecido',
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
    { name: 'Lucro Barbearia', value: metrics.shopProfit, color: 'hsl(var(--primary))' },
    { name: 'Comissões Barbeiros', value: metrics.totalCommissions, color: '#22c55e' },
  ];
  
  const COLORS = ['hsl(var(--primary))', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h1 className="font-display text-xl sm:text-2xl uppercase">Controle Financeiro</h1>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger className="w-full sm:w-[160px] bg-card h-9 text-sm">
                <SelectValue placeholder="Todos barbeiros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos barbeiros</SelectItem>
                {barbers?.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex bg-card border border-border rounded-lg overflow-hidden">
              {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'rounded-none flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 h-9',
                    dateRange === range && 'bg-primary text-primary-foreground'
                  )}
                >
                  {rangeLabels[range]}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Metrics Cards - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
              <Users size={14} />
              <span className="text-xs sm:text-sm truncate">Atendimentos</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              {metrics.totalAttendances}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
              <DollarSign size={14} />
              <span className="text-xs sm:text-sm truncate">Faturamento</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500 truncate">
              R$ {metrics.totalRevenue.toFixed(0)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
              <Percent size={14} />
              <span className="text-xs sm:text-sm truncate">Comissões</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-500 truncate">
              R$ {metrics.totalCommissions.toFixed(0)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
              <PiggyBank size={14} />
              <span className="text-xs sm:text-sm truncate">Lucro</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate">
              R$ {metrics.shopProfit.toFixed(0)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
              <TrendingUp size={14} />
              <span className="text-xs sm:text-sm truncate">Ticket Médio</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500 truncate">
              R$ {metrics.averageTicket.toFixed(0)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
              <Calendar size={14} />
              <span className="text-xs sm:text-sm truncate">Período</span>
            </div>
            <div className="text-base sm:text-lg md:text-xl font-bold truncate">
              {rangeLabels[dateRange]}
            </div>
          </div>
        </div>
        
        {/* Charts - Stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Atendimentos por Barbeiro */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Users size={16} className="text-primary" />
              Faturamento por Barbeiro
            </h3>
            
            {barberChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barberChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toFixed(0)}`,
                      name === 'faturamento' ? 'Faturamento' : 'Comissão'
                    ]}
                  />
                  <Bar dataKey="faturamento" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comissao" name="Comissão" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Sem dados para o período
              </p>
            )}
          </div>
          
          {/* Profit Distribution */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <PiggyBank size={16} className="text-primary" />
              Distribuição do Lucro
            </h3>
            
            {metrics.totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={profitDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ value }) => `R$ ${value.toFixed(0)}`}
                  >
                    {profitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(0)}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Sem dados para o período
              </p>
            )}
          </div>
          
          {/* Serviços Mais Populares */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 md:col-span-2 lg:col-span-1">
            <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Scissors size={16} className="text-primary" />
              Serviços Populares
            </h3>
            
            {serviceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ value }) => `${value}`}
                  >
                    {serviceChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Sem dados para o período
              </p>
            )}
          </div>
        </div>
        
        {/* Barber Commissions Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold flex items-center gap-2">
              <Percent size={18} className="text-primary" />
              Comissões por Barbeiro
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">Barbeiro</th>
                  <th className="p-3 text-center text-sm font-medium">% Comissão</th>
                  <th className="p-3 text-center text-sm font-medium">Atendimentos</th>
                  <th className="p-3 text-right text-sm font-medium">Faturado</th>
                  <th className="p-3 text-right text-sm font-medium">Comissão</th>
                  <th className="p-3 text-right text-sm font-medium">Lucro Barbearia</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.attendancesByBarber).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Nenhum atendimento no período
                    </td>
                  </tr>
                ) : (
                  Object.entries(metrics.attendancesByBarber).map(([barberId, data]) => {
                    const barber = barbers?.find(b => b.id === barberId);
                    const profit = data.revenue - data.commission;
                    
                    return (
                      <tr key={barberId} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 text-sm font-medium">{barber?.display_name || 'Desconhecido'}</td>
                        <td className="p-3 text-sm text-center">{data.commissionPercentage}%</td>
                        <td className="p-3 text-sm text-center">{data.count}</td>
                        <td className="p-3 text-sm text-right text-green-500 font-medium">
                          R$ {data.revenue.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3 text-sm text-right text-orange-500 font-medium">
                          R$ {data.commission.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3 text-sm text-right text-primary font-bold">
                          R$ {profit.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {Object.entries(metrics.attendancesByBarber).length > 0 && (
                <tfoot>
                  <tr className="bg-muted/50">
                    <td className="p-3 text-sm font-bold">TOTAL</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-sm text-center font-bold">{metrics.totalAttendances}</td>
                    <td className="p-3 text-sm text-right text-green-500 font-bold">
                      R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-3 text-sm text-right text-orange-500 font-bold">
                      R$ {metrics.totalCommissions.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-3 text-sm text-right text-primary font-bold">
                      R$ {metrics.shopProfit.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        
        {/* Attendance Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold">Histórico de Atendimentos</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">Data/Hora</th>
                  <th className="p-3 text-left text-sm font-medium">Cliente</th>
                  <th className="p-3 text-left text-sm font-medium">Barbeiro</th>
                  <th className="p-3 text-left text-sm font-medium">Serviço</th>
                  <th className="p-3 text-right text-sm font-medium">Valor</th>
                  <th className="p-3 text-left text-sm font-medium">Pagamento</th>
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
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Nenhum atendimento encontrado
                    </td>
                  </tr>
                ) : (
                  records?.slice(0, 20).map((record) => {
                    const barber = barbers?.find(b => b.id === record.barber_id);
                    const service = services?.find(s => s.id === record.service_id);
                    const date = new Date(record.completed_at);
                    
                    return (
                      <tr key={record.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 text-sm">
                          {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-sm">{record.customer_name}</td>
                        <td className="p-3 text-sm">{barber?.display_name || '-'}</td>
                        <td className="p-3 text-sm">{service?.name || '-'}</td>
                        <td className="p-3 text-sm text-right font-medium text-green-500">
                          R$ {Number(record.price_charged).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3 text-sm capitalize">{record.payment_method || '-'}</td>
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
