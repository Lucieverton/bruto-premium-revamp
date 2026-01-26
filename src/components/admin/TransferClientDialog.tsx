import { useState } from 'react';
import { ArrowRightLeft, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminBarbers } from '@/hooks/useAdminBarbers';
import { useTransferClient } from '@/hooks/useQueueTransfers';

interface TransferClientDialogProps {
  queueItemId: string;
  currentBarberId: string | null;
  customerName: string;
  ticketNumber: string;
}

export const TransferClientDialog = ({ 
  queueItemId, 
  currentBarberId, 
  customerName,
  ticketNumber,
}: TransferClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [reason, setReason] = useState('');
  
  const { data: barbers } = useAdminBarbers();
  const transferClient = useTransferClient();

  // Filter out current barber
  const availableBarbers = barbers?.filter(b => 
    b.id !== currentBarberId
  ) || [];

  const handleTransfer = () => {
    if (!selectedBarberId) return;
    
    transferClient.mutate({
      queueItemId,
      toBarberId: selectedBarberId,
      reason: reason || undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setSelectedBarberId('');
        setReason('');
      }
    });
  };

  const getBarberName = (barberId: string | null) => {
    if (!barberId) return 'Nenhum';
    return barbers?.find(b => b.id === barberId)?.display_name || 'Desconhecido';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <ArrowRightLeft size={12} className="mr-1" />
          Transferir
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-primary" />
            Transferir Cliente
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Client Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{ticketNumber}</span>
              <span className="font-medium">{customerName}</span>
            </div>
            {currentBarberId && (
              <div className="text-sm text-muted-foreground">
                Barbeiro atual: <span className="text-foreground">{getBarberName(currentBarberId)}</span>
              </div>
            )}
          </div>
          
          {/* Select New Barber */}
          <div className="space-y-2">
            <Label>Transferir para:</Label>
            {availableBarbers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum barbeiro disponível no momento.
              </p>
            ) : (
              <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione um barbeiro..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBarbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          barber.status === 'online' ? 'bg-green-500' : 
                          barber.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                        }`} />
                        {barber.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Reason (optional) */}
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Input
              placeholder="Ex: Cliente preferiu outro profissional"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={!selectedBarberId || transferClient.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {transferClient.isPending ? (
              <Loader2 size={14} className="animate-spin mr-1" />
            ) : (
              <ArrowRightLeft size={14} className="mr-1" />
            )}
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
