import { useState, useEffect } from 'react';
import { 
  Phone, 
  Play, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Clock,
  User,
  MessageCircle,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QueueItem, useServices, useQueueItemServices, useAddServiceToQueueItem, useRemoveServiceFromQueueItem } from '@/hooks/useQueue';
import { useAdminBarbers } from '@/hooks/useAdminBarbers';
import { 
  useCallClient, 
  useStartService, 
  useCompleteService, 
  useMarkNoShow,
  useDeleteQueueItem 
} from '@/hooks/useAdminQueue';
import { cn } from '@/lib/utils';
import { QueueItemServicesDisplay } from './QueueItemServicesDisplay';

interface QueueCardProps {
  item: QueueItem;
}

export const QueueCard = ({ item }: QueueCardProps) => {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [priceCharged, setPriceCharged] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(item.barber_id || '');
  const [addServiceId, setAddServiceId] = useState('');
  
  const { data: services } = useServices();
  const { data: barbers } = useAdminBarbers();
  const { data: itemServices, isLoading: loadingServices } = useQueueItemServices(item.id);
  
  const callClient = useCallClient();
  const startService = useStartService();
  const completeService = useCompleteService();
  const markNoShow = useMarkNoShow();
  const deleteItem = useDeleteQueueItem();
  const addServiceMutation = useAddServiceToQueueItem();
  const removeServiceMutation = useRemoveServiceFromQueueItem();
  
  const barber = barbers?.find(b => b.id === item.barber_id);
  
  // Calculate total from actual services
  const totalPrice = itemServices?.reduce((sum, s) => sum + Number(s.price_at_time), 0) || 0;
  
  // Pre-fill price when opening dialog based on actual services
  const openCompleteDialog = () => {
    setPriceCharged(totalPrice.toFixed(2).replace('.', ','));
    setShowCompleteDialog(true);
  };
  
  // Effect to update price when services change
  useEffect(() => {
    if (showCompleteDialog && itemServices) {
      const total = itemServices.reduce((sum, s) => sum + Number(s.price_at_time), 0);
      setPriceCharged(total.toFixed(2).replace('.', ','));
    }
  }, [itemServices, showCompleteDialog]);
  
  // Calculate time waiting
  const created = new Date(item.created_at);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
  
  const getTimeString = () => {
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  };
  
  const handleCall = () => {
    callClient.mutate(item.id);
  };
  
  const handleStart = () => {
    startService.mutate({ ticketId: item.id, barberId: selectedBarber || undefined });
  };
  
  const handleComplete = () => {
    const price = parseFloat(priceCharged.replace(',', '.')) || totalPrice || 0;
    
    // Build services array for the RPC
    const servicesData = itemServices?.map(s => ({
      service_id: s.service_id,
      service_name: s.service_name,
      price_charged: Number(s.price_at_time)
    })) || [];
    
    completeService.mutate({
      ticketId: item.id,
      priceCharged: price,
      paymentMethod: paymentMethod || undefined,
    });
    setShowCompleteDialog(false);
  };
  
  const handleAddService = () => {
    if (addServiceId) {
      addServiceMutation.mutate({ queueItemId: item.id, serviceId: addServiceId });
      setAddServiceId('');
    }
  };
  
  const handleRemoveService = (serviceId: string) => {
    removeServiceMutation.mutate({ queueItemId: item.id, serviceId });
  };
  
  const handleNoShow = () => {
    if (confirm('Marcar cliente como não compareceu?')) {
      markNoShow.mutate(item.id);
    }
  };
  
  const handleDelete = () => {
    if (confirm('Remover cliente da fila?')) {
      deleteItem.mutate(item.id);
    }
  };
  
  const whatsappUrl = `https://wa.me/55${item.customer_phone}`;

  return (
    <>
      <div className={cn(
        'bg-card border rounded-lg p-3 sm:p-4 transition-all duration-300',
        item.status === 'called' && 'border-green-500 bg-green-500/10 animate-pulse',
        item.status === 'in_progress' && 'border-blue-500 bg-blue-500/10',
        item.status === 'waiting' && 'border-border'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className={cn(
              'text-lg sm:text-2xl font-bold',
              item.status === 'called' && 'text-green-500',
              item.status === 'in_progress' && 'text-blue-500',
              item.status === 'waiting' && 'text-primary'
            )}>
              {item.ticket_number}
            </span>
            
            {item.priority === 'preferencial' && (
              <span className="text-[10px] sm:text-xs bg-purple-500/20 text-purple-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                ⭐
              </span>
            )}
            
            <span className={cn(
              'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded',
              item.origin === 'online' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
            )}>
              {item.origin === 'online' ? '🌐' : '🏪'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
            <Clock size={12} />
            {getTimeString()}
          </div>
        </div>
        
        {/* Client Info */}
        <div className="space-y-1 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <User size={12} className="text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base break-words" title={item.customer_name}>{item.customer_name}</span>
          </div>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-green-500 hover:text-green-400"
          >
            <MessageCircle size={12} />
            {item.customer_phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
          </a>
          
          {/* Services Display - Shows all selected services */}
          <div className="mt-1.5 p-2 bg-muted/30 rounded-md border border-border/50">
            <QueueItemServicesDisplay queueItemId={item.id} compact={item.status === 'completed'} />
          </div>
          
          {barber && (
            <div className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
              Barbeiro: <span className="text-primary">{barber.display_name}</span>
            </div>
          )}
        </div>
        
        {/* Barber Selection */}
        {(item.status === 'called' || item.status === 'waiting') && (
          <div className="mb-2 sm:mb-3">
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger className="bg-background h-8 text-xs sm:text-sm">
                <SelectValue placeholder="Barbeiro..." />
              </SelectTrigger>
              <SelectContent>
                {barbers?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        b.status === 'online' ? 'bg-green-500' : 
                        b.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                      }`} />
                      {b.display_name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {item.status === 'waiting' && (
            <>
              <Button
                size="sm"
                onClick={handleCall}
                disabled={callClient.isPending}
                className="bg-green-600 hover:bg-green-700 text-white flex-1 h-8 text-xs sm:text-sm"
              >
                <Phone size={12} className="mr-1" />
                Chamar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={deleteItem.isPending}
                className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
              >
                <Trash2 size={12} />
              </Button>
            </>
          )}
          
          {item.status === 'called' && (
            <>
              <Button
                size="sm"
                onClick={handleStart}
                disabled={startService.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-8 text-xs sm:text-sm"
              >
                <Play size={12} className="mr-1" />
                Iniciar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNoShow}
                disabled={markNoShow.isPending}
                className="text-yellow-500 hover:bg-yellow-500/10 h-8 w-8 p-0"
              >
                <XCircle size={12} />
              </Button>
            </>
          )}
          
          {item.status === 'in_progress' && (
            <Button
              size="sm"
              onClick={openCompleteDialog}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 h-8 text-xs sm:text-sm"
            >
              <CheckCircle size={12} className="mr-1" />
              Finalizar
            </Button>
          )}
        </div>
      </div>
      
      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento - {item.ticket_number}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Services */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Serviços na comanda</span>
                <Badge variant="outline" className="text-xs">
                  {itemServices?.length || 0} {(itemServices?.length || 0) === 1 ? 'serviço' : 'serviços'}
                </Badge>
              </Label>
              
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50 space-y-2 max-h-[200px] overflow-y-auto">
                {loadingServices ? (
                  <div className="text-sm text-muted-foreground text-center py-2">Carregando...</div>
                ) : itemServices && itemServices.length > 0 ? (
                  itemServices.map((svc) => (
                    <div key={svc.service_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{svc.service_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary whitespace-nowrap">
                          R$ {Number(svc.price_at_time).toFixed(2).replace('.', ',')}
                        </span>
                        {itemServices.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveService(svc.service_id)}
                            disabled={removeServiceMutation.isPending}
                          >
                            <X size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">Nenhum serviço selecionado</div>
                )}
              </div>
              
              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-medium">Total dos serviços:</span>
                <span className="text-lg font-bold text-primary">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
            
            {/* Add Service */}
            <div className="space-y-2">
              <Label>Adicionar serviço extra</Label>
              <div className="flex gap-2">
                <Select value={addServiceId} onValueChange={setAddServiceId}>
                  <SelectTrigger className="bg-background flex-1">
                    <SelectValue placeholder="Selecione um serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.filter(s => !itemServices?.find(is => is.service_id === s.id)).map((svc) => (
                      <SelectItem key={svc.id} value={svc.id}>
                        {svc.name} - R$ {svc.price.toFixed(2).replace('.', ',')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  onClick={handleAddService}
                  disabled={!addServiceId || addServiceMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            
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
              onClick={handleComplete}
              disabled={completeService.isPending || !itemServices?.length || !paymentMethod}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};