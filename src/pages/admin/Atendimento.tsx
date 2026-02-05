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
  Users,
  Bell
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
import { useTodayQueue, useServices, useQueueItemServices, useAddServiceToQueueItem, useRemoveServiceFromQueueItem } from '@/hooks/useQueue';
import { useAdminBarbers } from '@/hooks/useAdminBarbers';
import { useBarberStartService, useBarberCompleteService } from '@/hooks/useBarberQueue';
import { useBarberCallClient } from '@/hooks/useBarberDirectEntry';
import { useQueueRealtime, useBarbersRealtime, useQueueTransfersRealtime } from '@/hooks/useQueueRealtime';
import { BarberQueueEntryForm } from '@/components/admin/BarberQueueEntryForm';
import { TransferClientDialog } from '@/components/admin/TransferClientDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { QueueItemServicesDisplay } from '@/components/admin/QueueItemServicesDisplay';

const Atendimento = () => {
  const { user } = useAuth();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [priceCharged, setPriceCharged] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showAddServiceSelect, setShowAddServiceSelect] = useState(false);
  
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
  const { data: allBarbers } = useAdminBarbers();
  
  // Fetch services for selected ticket (for dialog)
  const { data: ticketServices, refetch: refetchTicketServices } = useQueueItemServices(selectedTicket);
  const addServiceToTicket = useAddServiceToQueueItem();
  const removeServiceFromTicket = useRemoveServiceFromQueueItem();

  // Auto-update price when services change or dialog opens
  useEffect(() => {
    if (showCompleteDialog && ticketServices && ticketServices.length > 0) {
      const total = ticketServices.reduce((sum, s) => sum + Number(s.price_at_time), 0);
      setPriceCharged(total.toFixed(2).replace('.', ','));
    }
  }, [ticketServices, showCompleteDialog]);

  // Mutations
  const startService = useBarberStartService();
  const completeService = useBarberCompleteService();
  const callClient = useBarberCallClient();

  // Filter queue items - SECURITY: Only show clients assigned to this barber OR with no barber assigned
  // Barbers can only see and manage their own clients - NOT other barbers' clients
  const waitingQueue = queue?.filter(q => 
    q.status === 'waiting' && 
    (q.barber_id === barber?.id || q.barber_id === null)
  ) || [];
  
  // Called queue - ONLY show clients that belong to THIS barber or have no barber assigned
  const calledQueue = queue?.filter(q => 
    q.status === 'called' && 
    (q.barber_id === barber?.id || q.barber_id === null)
  ) || [];
  
  // In progress - ONLY show THIS barber's active services
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

  // Calculate total from ticketServices
  const calculateTotal = () => {
    if (!ticketServices || ticketServices.length === 0) return 0;
    return ticketServices.reduce((sum, s) => sum + Number(s.price_at_time), 0);
  };

  // Open complete dialog
  const openCompleteDialog = (ticketId: string, initialServiceId?: string) => {
    setSelectedTicket(ticketId);
    // Price will be set by useEffect when ticketServices loads
    setPriceCharged('');
    setShowAddServiceSelect(false);
    setShowCompleteDialog(true);
    // Trigger refetch of ticket services
    refetchTicketServices();
  };

  // Handle adding extra service
  const handleAddExtraService = (serviceId: string) => {
    if (!selectedTicket) return;
    addServiceToTicket.mutate(
      { queueItemId: selectedTicket, serviceId },
      {
        onSuccess: () => {
          refetchTicketServices();
          setShowAddServiceSelect(false);
        }
      }
    );
  };

  // Handle removing service
  const handleRemoveService = (serviceId: string) => {
    if (!selectedTicket) return;
    removeServiceFromTicket.mutate(
      { queueItemId: selectedTicket, serviceId },
      { onSuccess: () => refetchTicketServices() }
    );
  };

  // Update price when ticketServices changes
  const updatePriceFromServices = () => {
    if (ticketServices && ticketServices.length > 0) {
      const total = ticketServices.reduce((sum, s) => sum + Number(s.price_at_time), 0);
      setPriceCharged(total.toFixed(2).replace('.', ','));
    }
  };

  // Handle complete service
  const handleCompleteService = () => {
    if (!selectedTicket) return;
    
    // Use the manual price or calculate from services
    const price = parseFloat(priceCharged.replace(',', '.')) || calculateTotal();
    
    if (price <= 0) return;
    
    // Prepare services array for tracking
    const servicesArray = ticketServices?.map(ts => ({
      service_id: ts.service_id,
      service_name: ts.service_name,
      price_charged: Number(ts.price_at_time),
    })) || [];

    completeService.mutate({
      ticketId: selectedTicket,
      priceCharged: price,
      paymentMethod: paymentMethod || undefined,
      services: servicesArray.length > 0 ? servicesArray : undefined,
    });
    
    setShowCompleteDialog(false);
    setPriceCharged('');
    setPaymentMethod('');
    setSelectedTicket(null);
    setShowAddServiceSelect(false);
  };

  // Services not yet added to the ticket
  const availableServicesToAdd = services?.filter(
    s => !ticketServices?.some(ts => ts.service_id === s.id)
  ) || [];


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

        {/* Queue Entry Form for Barbers - now with direct entry support */}
        {barber && (
          <BarberQueueEntryForm 
            barberId={barber.id} 
            canAddDirectly={barber.can_add_clients_directly} 
          />
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
                          
                          {/* Show all services from queue_item_services */}
                          <QueueItemServicesDisplay queueItemId={item.id} />
                        </div>
                        
                        <Button
                          onClick={() => openCompleteDialog(item.id, service?.id)}
                          className="bg-success hover:bg-success/90"
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
                            {/* Show services */}
                            <QueueItemServicesDisplay queueItemId={item.id} compact />
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
                            
                            {/* Show services with values */}
                            <QueueItemServicesDisplay queueItemId={item.id} compact />
                          </div>
                          
                          {item.priority === 'preferencial' && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                              ⭐
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Transfer Button */}
                          <TransferClientDialog
                            queueItemId={item.id}
                            currentBarberId={item.barber_id}
                            customerName={item.customer_name}
                            ticketNumber={item.ticket_number}
                          />
                          
                          {/* Call Client Button - separate from starting service */}
                          {myInProgress.length === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => callClient.mutate({ ticketId: item.id, barberId: barber!.id })}
                              disabled={callClient.isPending}
                              className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                            >
                              <Bell size={14} className="mr-1" />
                              Chamar
                            </Button>
                          )}
                          
                          {/* Start Service Button */}
                          {myInProgress.length === 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleStartService(item.id)}
                              disabled={startService.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play size={14} className="mr-1" />
                              Iniciar
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

      {/* Complete Dialog - Updated for Multiple Services */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Services on Ticket */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Serviços na Comanda</Label>
                {ticketServices && ticketServices.length > 0 && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {ticketServices.length} {ticketServices.length === 1 ? 'serviço' : 'serviços'}
                  </Badge>
                )}
              </div>
              
              {ticketServices && ticketServices.length > 0 ? (
                <div className="space-y-2">
                  {ticketServices.map((ts) => (
                    <div 
                      key={ts.service_id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                    >
                      <div>
                        <div className="font-medium text-sm">{ts.service_name}</div>
                        <div className="text-sm text-primary font-semibold">
                          R$ {Number(ts.price_at_time).toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      {ticketServices.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveService(ts.service_id)}
                          disabled={removeServiceFromTicket.isPending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-bold text-primary">
                      R$ {ticketServices.reduce((sum, s) => sum + Number(s.price_at_time), 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  Nenhum serviço adicionado. Adicione pelo menos um serviço.
                </div>
              )}
            </div>

            {/* Add Extra Service */}
            <div className="space-y-2">
              {!showAddServiceSelect ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddServiceSelect(true)}
                  className="w-full"
                  disabled={availableServicesToAdd.length === 0}
                >
                  <Plus size={14} className="mr-1" />
                  Adicionar Serviço Extra
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm">Selecione o serviço extra:</Label>
                  <Select onValueChange={handleAddExtraService}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Escolha um serviço..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServicesToAdd.map((svc) => (
                        <SelectItem key={svc.id} value={svc.id}>
                          {svc.name} - R$ {svc.price.toFixed(2).replace('.', ',')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddServiceSelect(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Valor Final</Label>
              <Input
                placeholder="R$ 0,00"
                value={priceCharged}
                onChange={(e) => setPriceCharged(e.target.value)}
                className="bg-background"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Altere apenas se houver desconto ou acréscimo
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={updatePriceFromServices}
                  className="text-xs h-auto py-1"
                >
                  Recalcular
                </Button>
              </div>
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
              disabled={completeService.isPending || !paymentMethod || (parseFloat(priceCharged.replace(',', '.')) || 0) <= 0}
              className="bg-success hover:bg-success/90"
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
