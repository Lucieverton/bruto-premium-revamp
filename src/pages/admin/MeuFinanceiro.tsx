import { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Users, 
  Clock, 
  Download, 
  Send, 
  FileText, 
  Calendar,
  TrendingUp,
  Loader2,
  Scissors,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarberEarningsCard } from '@/components/admin/BarberEarningsCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

// Interface for service in attendance
interface AttendanceService {
  service_id: string;
  service_name: string;
  price_charged: number;
}

// Interface for detailed attendance record
interface DetailedAttendance {
  id: string;
  customer_name: string;
  services: AttendanceService[];
  price_charged: number;
  payment_method: string | null;
  completed_at: string;
  commission: number;
}

const MeuFinanceiro = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Get barber profile
  const { data: barber, isLoading: barberLoading } = useQuery({
    queryKey: ['my-barber-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get daily attendance records with all services
  const { data: dailyRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['barber-daily-records', barber?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!barber?.id) return [];
      
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Use RPC to get attendance with all services
      const { data: records, error } = await supabase
        .rpc('get_attendance_with_services', {
          p_start_date: startOfDay.toISOString(),
          p_end_date: endOfDay.toISOString(),
          p_barber_id: barber.id,
        });
      
      if (error) throw error;
      
      const commissionPct = barber.commission_percentage || 50;
      
      return (records || []).map(r => ({
        id: r.id,
        customer_name: r.customer_name,
        services: (Array.isArray(r.services) ? r.services : []) as unknown as AttendanceService[],
        price_charged: Number(r.price_charged),
        payment_method: r.payment_method,
        completed_at: r.completed_at,
        commission: (Number(r.price_charged) * commissionPct) / 100,
      })) as DetailedAttendance[];
    },
    enabled: !!barber?.id,
  });

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    if (!dailyRecords || dailyRecords.length === 0) {
      return {
        totalClients: 0,
        totalRevenue: 0,
        totalCommission: 0,
      };
    }

    return {
      totalClients: dailyRecords.length,
      totalRevenue: dailyRecords.reduce((sum, r) => sum + r.price_charged, 0),
      totalCommission: dailyRecords.reduce((sum, r) => sum + r.commission, 0),
    };
  }, [dailyRecords]);

  // Format payment method
  const formatPaymentMethod = (method: string | null) => {
    const methods: Record<string, { label: string; color: string }> = {
      dinheiro: { label: 'Dinheiro', color: 'bg-green-500/20 text-green-400' },
      pix: { label: 'PIX', color: 'bg-blue-500/20 text-blue-400' },
      debito: { label: 'Débito', color: 'bg-purple-500/20 text-purple-400' },
      credito: { label: 'Crédito', color: 'bg-orange-500/20 text-orange-400' },
      pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
    };
    return methods[method || 'pendente'] || methods.pendente;
  };

  // Generate extract content
  const generateExtractContent = () => {
    if (!barber || !dailyRecords) return '';

    const dateStr = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const commissionPct = barber.commission_percentage || 50;

    let content = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    EXTRATO DIÁRIO - BARBEARIA BRUTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Barbeiro: ${barber.display_name}
Data: ${dateStr}
Comissão: ${commissionPct}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         RESUMO DO DIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total de Clientes: ${dailyTotals.totalClients}
Faturamento Total: R$ ${dailyTotals.totalRevenue.toFixed(2)}
Minha Comissão: R$ ${dailyTotals.totalCommission.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         SERVIÇOS REALIZADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    dailyRecords.forEach((record, index) => {
      const time = format(new Date(record.completed_at), 'HH:mm');
      const payment = formatPaymentMethod(record.payment_method);
      const servicesText = record.services.length > 0 
        ? record.services.map(s => s.service_name).join(', ')
        : 'Serviço';
      
      content += `
${index + 1}. ${record.customer_name}
   Serviços: ${servicesText}
   Horário: ${time}
   Valor: R$ ${record.price_charged.toFixed(2)}
   Comissão: R$ ${record.commission.toFixed(2)}
   Pagamento: ${payment.label}
`;
    });

    content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return content;
  };

  // Export as TXT
  const handleExportTXT = () => {
    const content = generateExtractContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato_${barber?.display_name?.replace(/\s+/g, '_')}_${format(selectedDate, 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Extrato exportado!',
      description: 'O arquivo TXT foi baixado com sucesso.',
    });
  };

  // Export as PDF (using print)
  const handleExportPDF = () => {
    const content = generateExtractContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Extrato - ${barber?.display_name} - ${format(selectedDate, 'dd/MM/yyyy')}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                padding: 20px;
                white-space: pre-wrap;
                background: #fff;
                color: #000;
              }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast({
      title: 'Preparando PDF',
      description: 'Use Ctrl+P ou a opção "Salvar como PDF" na janela de impressão.',
    });
  };

  // Send to WhatsApp (admin number)
  const handleSendWhatsApp = () => {
    const content = generateExtractContent();
    const phoneNumber = '558293889799';
    const encodedContent = encodeURIComponent(content);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedContent}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'Enviando para WhatsApp',
      description: 'O extrato será enviado para a administração.',
    });
  };

  if (barberLoading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  if (!barber) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6">
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Perfil de barbeiro não encontrado.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <DollarSign className="text-green-500" size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl uppercase">Meu Financeiro</h1>
              <p className="text-sm text-muted-foreground">Controle individual de comissões e serviços</p>
            </div>
          </div>
        </div>

        {/* Daily Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-card border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão Hoje</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {dailyTotals.totalCommission.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-card border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Hoje</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {dailyTotals.totalClients}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <TrendingUp size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {dailyTotals.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Selector and Export Actions */}
        <Card className="bg-gradient-to-br from-card to-muted/10">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Extrato Detalhado
              </CardTitle>
              
              <div className="flex flex-wrap gap-2">
                {/* Date Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar size={16} />
                      {format(selectedDate, 'dd/MM/yyyy')}
                      <ChevronDown size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download size={16} />
                      Exportar
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportTXT} className="gap-2">
                      <FileText size={16} />
                      Exportar TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                      <Download size={16} />
                      Exportar PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* WhatsApp Button */}
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSendWhatsApp}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  disabled={dailyTotals.totalClients === 0}
                >
                  <Send size={16} />
                  <span className="hidden sm:inline">Enviar WhatsApp</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {recordsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : dailyRecords && dailyRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Horário</TableHead>
                      <TableHead className="min-w-[120px]">Cliente</TableHead>
                      <TableHead className="min-w-[120px]">Serviço</TableHead>
                      <TableHead className="min-w-[80px]">Valor</TableHead>
                      <TableHead className="min-w-[80px]">Comissão</TableHead>
                      <TableHead className="min-w-[100px]">Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyRecords.map((record) => {
                      const payment = formatPaymentMethod(record.payment_method);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted-foreground" />
                              {format(new Date(record.completed_at), 'HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{record.customer_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {record.services.length > 0 ? (
                                record.services.map((svc, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Scissors size={12} className="text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{svc.service_name}</span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      (R$ {Number(svc.price_charged).toFixed(2)})
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted-foreground">Serviço</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            R$ {record.price_charged.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-bold text-green-400">
                            R$ {record.commission.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={payment.color}>
                              {payment.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Scissors className="mx-auto mb-3 text-muted-foreground" size={32} />
                <p className="text-muted-foreground">
                  Nenhum atendimento registrado para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Annual Earnings Section (moved from MeuPerfil) */}
        <BarberEarningsCard 
          barberId={barber.id} 
          barberName={barber.display_name}
          commissionPercentage={barber.commission_percentage}
        />
      </div>
    </AdminLayout>
  );
};

export default MeuFinanceiro;
