import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAttendanceRecords, useFinancialMetrics } from '@/hooks/useFinancial';
import { useBarbers, useServices } from '@/hooks/useQueue';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Scissors,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'year';

const AdminFinanceiro = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  
  const { data: records, isLoading } = useAttendanceRecords(dateRange, selectedBarber || undefined);
  const metrics = useFinancialMetrics(dateRange, selectedBarber || undefined);
  const { data: barbers } = useBarbers();
  const { data: services } = useServices();
  
  const rangeLabels: Record<DateRange, string> = {
    today: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês',
    year: 'Este Ano',
  };
  
  // Prepare chart data
  const barberChartData = Object.entries(metrics.attendancesByBarber).map(([barberId, data]) => {
    const barber = barbers?.find(b => b.id === barberId);
    return {
      name: barber?.display_name || 'Desconhecido',
      atendimentos: data.count,
      faturamento: data.revenue,
    };
  });
  
  const serviceChartData = metrics.popularServices.slice(0, 5).map(({ serviceId, count }) => {
    const service = services?.find(s => s.id === serviceId);
    return {
      name: service?.name || 'Desconhecido',
      value: count,
    };
  });
  
  const COLORS = ['hsl(var(--primary))', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl uppercase">Controle Financeiro</h1>
          
          <div className="flex items-center gap-3">
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Todos barbeiros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos barbeiros</SelectItem>
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
                    'rounded-none',
                    dateRange === range && 'bg-primary text-primary-foreground'
                  )}
                >
                  {rangeLabels[range]}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users size={18} />
              <span className="text-sm">Atendimentos</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {metrics.totalAttendances}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign size={18} />
              <span className="text-sm">Faturamento</span>
            </div>
            <div className="text-3xl font-bold text-green-500">
              R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp size={18} />
              <span className="text-sm">Ticket Médio</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">
              R$ {metrics.averageTicket.toFixed(2).replace('.', ',')}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar size={18} />
              <span className="text-sm">Período</span>
            </div>
            <div className="text-xl font-bold">
              {rangeLabels[dateRange]}
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Atendimentos por Barbeiro */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Atendimentos por Barbeiro
            </h3>
            
            {barberChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barberChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="atendimentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Sem dados para o período selecionado
              </p>
            )}
          </div>
          
          {/* Serviços Mais Populares */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Scissors size={18} className="text-primary" />
              Serviços Mais Populares
            </h3>
            
            {serviceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {serviceChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Sem dados para o período selecionado
              </p>
            )}
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
