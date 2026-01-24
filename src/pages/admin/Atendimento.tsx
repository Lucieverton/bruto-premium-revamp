import { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  User, 
  Phone,
  Loader2,
  Clock,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Target,
  Users
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTodayQueue, useServices, useBarbers } from '@/hooks/useQueue';
import { useBarberStartService, useBarberCompleteService } from '@/hooks/useBarberQueue';
import { useQueueRealtime, useBarbersRealtime, useQueueTransfersRealtime } from '@/hooks/useQueueRealtime';
import { RequestQueueEntryForm } from '@/components/admin/RequestQueueEntryForm';
import { TransferClientDialog } from '@/components/admin/TransferClientDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Atendimento = () => {
  const { user } = useAuth();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [priceCharged, setPriceCharged] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // Enable realtime updates
  useQueueRealtime();
  useBarbersRealtime();
  useQueueTransfersRealtime();

  // Fetch barber profile
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

  // Fetch today's queue
  const { data: queue, isLoading: queueLoading } = useTodayQueue();
  const { data: services } = useServices();
  const { data: allBarbers } = useBarbers();

  // Mutations
  const startService = useBarberStartService();
  const completeService = useBarberCompleteService();

  // Filter queue items - PHASE 3: Only show clients assigned to this barber OR with no barber assigned
  const waitingQueue = queue?.filter(q => 
    q.status === 'waiting' && 
    (q.barber_id === barber?.id || q.barber_id === null)
  ) || [];
  
  const calledQueue = queue?.filter(q => q.status === 'called') || [];
  const myInProgress = queue?.filter(q => 
    q.status === 'in_progress' && q.barber_id === barber?.id
  ) || [];

  // Get service details for a ticket
  const getService = (serviceId: string | null) => {
    if (!serviceId) return null;
    return services?.find(s => s.id === serviceId);
  };

  // Handle start service
  const handleStartService = (ticketId: string) => {
    if (!barber?.id) return;
    startService.mutate({ ticketId, barberId: barber.id });
  };

  // Handle service selection in dialog - auto-fill price
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const svc = services?.find(s => s.id === serviceId);
    if (svc) {
      setPriceCharged(svc.price.toFixed(2).replace('.', ','));
    }
  };

  // Handle complete service
  const handleCompleteService = () => {
    if (!selectedTicket || !selectedServiceId) return;
    
    const svc = services?.find(s => s.id === selectedServiceId);
    const price = parseFloat(priceCharged.replace(',', '.')) || svc?.price || 0;
    
    completeService.mutate({
      ticketId: selectedTicket,
      priceCharged: price,
      paymentMethod: paymentMethod || undefined,
    });
    
    setShowCompleteDialog(false);
    setPriceCharged('');
    setPaymentMethod('');
    setSelectedTicket(null);
    setSelectedServiceId('');
  };


  if (barberLoading || queueLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  if (!barber) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-4 text-destructive" size={48} />
              <p className="text-muted-foreground">
                Perfil de barbeiro não encontrado. Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl uppercase">Meus Atendimentos</h1>
              <p className="text-sm text-muted-foreground">Olá, {barber.display_name}</p>
            </div>
          </div>
          
          {/* Status Info Only - Control is in Meu Perfil */}
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-medium px-3 py-1.5 rounded-full',
              barber.is_available 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-muted text-muted-foreground'
            )}>
              {barber.is_available ? '🟢 Online' : '⚫ Offline'}
            </span>
          </div>
        </div>

        {/* Request Queue Entry Form for Barbers */}
        {barber && (
          <RequestQueueEntryForm barberId={barber.id} />
        )}
        <AnimatePresence>
          {myInProgress.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-2 border-blue-500 bg-blue-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-blue-500">
                    <Play size={20} />
                    Atendendo Agora
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myInProgress.map((item) => {
                    const service = getService(item.service_id);
                    const whatsappUrl = `https://wa.me/55${item.customer_phone}`;
                    
                    return (
                      <div 
                        key={item.id}
                        className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-blue-500">
                              {item.ticket_number}
                            </span>
                            {item.priority === 'preferencial' && (
                              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                ⭐ Preferencial
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-muted-foreground" />
                            <span className="font-medium">{item.customer_name}</span>
                          </div>
                          
                          <a 
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-green-500 hover:text-green-400"
                          >
                            <MessageCircle size={14} />
                            {item.customer_phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                          </a>
                          
                          {service && (
                            <div className="text-sm text-muted-foreground">
                              {service.name} - R$ {service.price.toFixed(2).replace('.', ',')}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => {
                            setSelectedTicket(item.id);
                            // Pre-fill with service if exists
                            if (service) {
                              setSelectedServiceId(service.id);
                              setPriceCharged(service.price.toFixed(2).replace('.', ','));
                            } else {
                              setSelectedServiceId('');
                              setPriceCharged('');
                            }
                            setShowCompleteDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Finalizar
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Called Clients Banner */}
        <AnimatePresence>
          {calledQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-2 border-green-500 bg-green-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-500">
                    <Phone size={20} className="animate-pulse" />
                    Clientes Chamados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {calledQueue.map((item) => {
                      const service = getService(item.service_id);
                      
                      return (
                        <div 
                          key={item.id}
                          className="bg-card border border-green-500/30 rounded-lg p-4 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xl font-bold text-green-500">{item.ticket_number}</div>
                            <div className="text-sm text-muted-foreground">{item.customer_name}</div>
                            {service && (
                              <div className="text-xs text-muted-foreground">{service.name}</div>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => handleStartService(item.id)}
                            disabled={startService.isPending || myInProgress.length > 0}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play size={14} className="mr-1" />
                            Atender
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} className="text-yellow-500" />
              Fila de Espera ({waitingQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {waitingQueue.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum cliente na fila de espera para você
              </p>
            ) : (
              <div className="space-y-2">
                {waitingQueue.map((item, index) => {
                  const service = getService(item.service_id);
                  const created = new Date(item.created_at);
                  const now = new Date();
                  const diffMins = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
                  const isDirectedToMe = item.barber_id === barber?.id;
                  const assignedBarber = item.barber_id ? allBarbers?.find(b => b.id === item.barber_id) : null;
                  
                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        'bg-card border border-border rounded-lg p-3',
                        index === 0 && 'border-yellow-500/50 bg-yellow-500/5',
                        isDirectedToMe && 'border-blue-500/50 bg-blue-500/5'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[50px]">
                            <div className="text-lg font-bold text-primary">{item.ticket_number}</div>
                            <div className="text-xs text-muted-foreground">{diffMins} min</div>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.customer_name}</span>
                              
                              {/* Visual indicator for client type */}
                              {isDirectedToMe ? (
                                <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                  <Target size={10} />
                                  Para você
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded">
                                  <Users size={10} />
                                  Geral
                                </span>
                              )}
                            </div>
                            
                            {service && (
                              <div className="text-xs text-muted-foreground">{service.name}</div>
                            )}
                          </div>
                          
                          {item.priority === 'preferencial' && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                              ⭐
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Transfer Button */}
                          <TransferClientDialog
                            queueItemId={item.id}
                            currentBarberId={item.barber_id}
                            customerName={item.customer_name}
                            ticketNumber={item.ticket_number}
                          />
                          
                          {index === 0 && myInProgress.length === 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleStartService(item.id)}
                              disabled={startService.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Phone size={14} className="mr-1" />
                              Chamar e Iniciar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Service Selection - Required */}
            <div className="space-y-2">
              <Label>Serviço Realizado *</Label>
              <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o serviço..." />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((svc) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.name} - R$ {svc.price.toFixed(2).replace('.', ',')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Show selected service info */}
            {selectedServiceId && (() => {
              const svc = services?.find(s => s.id === selectedServiceId);
              return svc ? (
                <div className="bg-primary/10 rounded-lg p-3 text-sm border border-primary/20">
                  <div className="font-medium text-primary">{svc.name}</div>
                  <div className="text-lg font-bold">R$ {svc.price.toFixed(2).replace('.', ',')}</div>
                </div>
              ) : null;
            })()}
            
            <div className="space-y-2">
              <Label>Valor Cobrado</Label>
              <Input
                placeholder="R$ 0,00"
                value={priceCharged}
                onChange={(e) => setPriceCharged(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Altere apenas se houver desconto ou acréscimo
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="debito">💳 Cartão Débito</SelectItem>
                  <SelectItem value="credito">💳 Cartão Crédito</SelectItem>
                  <SelectItem value="pendente">⏳ Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCompleteService}
              disabled={completeService.isPending || !selectedServiceId || !paymentMethod}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Atendimento;
