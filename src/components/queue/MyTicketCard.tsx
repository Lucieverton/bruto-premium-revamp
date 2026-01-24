import { useEffect, useState } from 'react';
import { Ticket, Clock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueItem, useLeaveQueue, useQueuePosition } from '@/hooks/useQueue';
import { clearMyTicket } from '@/lib/antiAbuse';
import { cn } from '@/lib/utils';

interface MyTicketCardProps {
  ticketId: string;
  onLeave: () => void;
}

export const MyTicketCard = ({ ticketId, onLeave }: MyTicketCardProps) => {
  const { data: ticket, isLoading: ticketLoading } = useQueueItem(ticketId);
  const { data: positionData } = useQueuePosition(ticketId);
  const leaveQueue = useLeaveQueue();
  const [timeWaiting, setTimeWaiting] = useState('');
  
  // Get position from secure RPC
  const position = positionData?.queue_position || 0;
  const isLoading = ticketLoading;
  
  // Update time waiting
  useEffect(() => {
    if (!ticket?.created_at) return;
    
    const updateTime = () => {
      const created = new Date(ticket.created_at);
      const now = new Date();
      const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
      
      if (diff < 60) {
        setTimeWaiting(`${diff} min`);
      } else {
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        setTimeWaiting(`${hours}h ${mins}min`);
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [ticket?.created_at]);
  
  const handleLeave = async () => {
    if (confirm('Tem certeza que deseja sair da fila?')) {
      await leaveQueue.mutateAsync(ticketId);
      clearMyTicket();
      onLeave();
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }
  
  if (!ticket || ticket.status === 'cancelled' || ticket.status === 'completed' || ticket.status === 'no_show') {
    clearMyTicket();
    onLeave();
    return null;
  }
  
  const getStatusConfig = () => {
    switch (ticket.status) {
      case 'called':
        return {
          bg: 'bg-green-500/20 border-green-500',
          text: 'text-green-500',
          label: '🎉 É SUA VEZ!',
          pulse: true,
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-500/20 border-blue-500',
          text: 'text-blue-500',
          label: 'Em atendimento',
          pulse: false,
        };
      default:
        return {
          bg: 'bg-yellow-500/20 border-yellow-500',
          text: 'text-yellow-500',
          label: 'Aguardando',
          pulse: false,
        };
    }
  };
  
  const statusConfig = getStatusConfig();

  return (
    <div className={cn(
      'relative border-2 rounded-lg p-6 transition-all duration-300',
      statusConfig.bg,
      statusConfig.pulse && 'animate-pulse'
    )}>
      {ticket.status === 'waiting' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLeave}
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
        >
          <X size={20} />
        </Button>
      )}
      
      <div className="text-center mb-6">
        <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4', statusConfig.text, 'bg-background/50')}>
          <Ticket size={16} />
          {statusConfig.label}
        </div>
        
        <div className="font-display text-5xl md:text-6xl text-primary mb-2">
          {ticket.ticket_number}
        </div>
        
        <div className="text-muted-foreground">
          {ticket.customer_name}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <div className="text-muted-foreground text-sm mb-1">Posição</div>
          <div className="text-2xl font-bold text-primary">
            {ticket.status === 'waiting' ? `${position}º` : '-'}
          </div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <div className="text-muted-foreground text-sm mb-1">Tempo</div>
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            <Clock size={18} className="text-primary" />
            {timeWaiting}
          </div>
        </div>
      </div>
      
      {ticket.status === 'called' && (
        <div className="mt-6 p-4 bg-green-500/30 rounded-lg text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="font-bold text-green-400">
            Dirija-se ao balcão!
          </p>
        </div>
      )}
      
      {ticket.priority === 'preferencial' && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1 text-sm bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
            ⭐ Atendimento Preferencial
          </span>
        </div>
      )}
    </div>
  );
};
