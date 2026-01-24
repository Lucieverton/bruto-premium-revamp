import { useEffect, useState, useRef } from 'react';
import { Ticket, Clock, MapPin, X, Star, Bell, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueItem, useLeaveQueue, useQueuePosition, useQueueStats } from '@/hooks/useQueue';
import { clearMyTicket } from '@/lib/antiAbuse';
import { sendNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';

interface MyTicketCardProps {
  ticketId: string;
  onLeave: () => void;
}

export const MyTicketCard = ({ ticketId, onLeave }: MyTicketCardProps) => {
  const { data: ticket, isLoading: ticketLoading } = useQueueItem(ticketId);
  const { data: positionData } = useQueuePosition(ticketId);
  const { data: stats } = useQueueStats();
  const leaveQueue = useLeaveQueue();
  const [timeWaiting, setTimeWaiting] = useState('');
  const lastPositionRef = useRef<number | null>(null);
  
  // Get position from secure RPC
  const position = positionData?.queue_position || 0;
  const isLoading = ticketLoading;
  const avgWaitTime = stats?.avg_wait_minutes || 15;
  
  // Calculate estimated time
  const estimatedMinutes = position > 0 ? (position - 1) * avgWaitTime : 0;
  
  // Notify when position changes to 1 (next in line)
  useEffect(() => {
    if (lastPositionRef.current !== null && lastPositionRef.current > 1 && position === 1) {
      sendNotification('🎉 Você é o próximo!', {
        body: 'Prepare-se, você será chamado em breve!',
        tag: 'queue-next',
      });
    }
    lastPositionRef.current = position;
  }, [position]);
  
  // Notify when called
  useEffect(() => {
    if (ticket?.status === 'called') {
      sendNotification('📢 É sua vez!', {
        body: 'Por favor, dirija-se ao balcão imediatamente!',
        tag: 'queue-called',
      });
    }
  }, [ticket?.status]);
  
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
  const isNextInLine = position === 1 && ticket.status === 'waiting';

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
      
      {/* Next in line banner */}
      {isNextInLine && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg animate-bounce">
            <Bell size={14} className="animate-pulse" />
            Você é o próximo!
          </div>
        </div>
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
      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="text-muted-foreground text-xs mb-1">Posição</div>
          <div className={cn(
            'text-2xl font-bold',
            isNextInLine ? 'text-green-500' : 'text-primary'
          )}>
            {ticket.status === 'waiting' ? `${position}º` : '-'}
          </div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="text-muted-foreground text-xs mb-1">Esperando</div>
          <div className="text-xl font-bold flex items-center justify-center gap-1">
            <Clock size={16} className="text-primary" />
            {timeWaiting}
          </div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="text-muted-foreground text-xs mb-1">Estimado</div>
          <div className="text-xl font-bold flex items-center justify-center gap-1">
            <Timer size={16} className="text-blue-400" />
            ~{estimatedMinutes}min
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
            <Star size={14} /> Atendimento Preferencial
          </span>
        </div>
      )}
    </div>
  );
};
