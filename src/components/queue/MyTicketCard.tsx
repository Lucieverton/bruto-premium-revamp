import { useEffect, useState, useRef } from 'react';
import { Ticket, Clock, MapPin, X, Star, Bell, Timer, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeaveQueue, useQueuePosition, useQueueStats } from '@/hooks/useQueue';
import { usePublicTicket } from '@/hooks/usePublicTicket';
import { clearMyTicket } from '@/lib/antiAbuse';
import { sendNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';

interface MyTicketCardProps {
  ticketId: string;
  onLeave: () => void;
}

export const MyTicketCard = ({ ticketId, onLeave }: MyTicketCardProps) => {
  const { ticket, isLoading: ticketLoading, isFetching, refetch } = usePublicTicket(ticketId);
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

  // IMPORTANT: This useEffect MUST be before any conditional returns to follow Rules of Hooks
  // If the public list is temporarily stale (right after joining), trigger a refetch
  useEffect(() => {
    if (ticketLoading) return;
    if (!ticket) {
      // One gentle refetch to pick up the newly created ticket
      refetch();
    }
  }, [ticket, ticketLoading, refetch]);
  
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

  if (!ticket) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className={cn('h-4 w-4', (ticketLoading || isFetching) && 'animate-spin')} />
          <span className="text-sm">Sincronizando seu ticket...</span>
        </div>
      </div>
    );
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
      'relative border-2 rounded-xl sm:rounded-lg p-4 sm:p-6 transition-all duration-300',
      statusConfig.bg,
      statusConfig.pulse && 'animate-pulse'
    )}>
      {ticket.status === 'waiting' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLeave}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-muted-foreground hover:text-destructive h-8 w-8 sm:h-10 sm:w-10"
        >
          <X size={18} />
        </Button>
      )}
      
      {/* Next in line banner */}
      {isNextInLine && (
        <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-green-500 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg animate-bounce">
            <Bell size={12} className="animate-pulse" />
            Você é o próximo!
          </div>
        </div>
      )}
      
      <div className="text-center mb-4 sm:mb-6">
        <div className={cn('inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold mb-3 sm:mb-4', statusConfig.text, 'bg-background/50')}>
          <Ticket size={14} />
          {statusConfig.label}
        </div>
        
        <div className="font-display text-4xl sm:text-5xl md:text-6xl text-primary mb-1 sm:mb-2">
          {ticket.ticket_number}
        </div>
        
        <div className="text-muted-foreground text-sm sm:text-base truncate px-2">
          {ticket.customer_name_masked}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-background/50 rounded-lg p-2 sm:p-3 text-center">
          <div className="text-muted-foreground text-[10px] sm:text-xs mb-0.5 sm:mb-1">Posição</div>
          <div className={cn(
            'text-xl sm:text-2xl font-bold',
            isNextInLine ? 'text-green-500' : 'text-primary'
          )}>
            {ticket.status === 'waiting' ? `${position}º` : '-'}
          </div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-2 sm:p-3 text-center">
          <div className="text-muted-foreground text-[10px] sm:text-xs mb-0.5 sm:mb-1">Esperando</div>
          <div className="text-lg sm:text-xl font-bold flex items-center justify-center gap-0.5 sm:gap-1">
            <Clock size={14} className="text-primary" />
            <span className="truncate">{timeWaiting}</span>
          </div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-2 sm:p-3 text-center">
          <div className="text-muted-foreground text-[10px] sm:text-xs mb-0.5 sm:mb-1">Estimado</div>
          <div className="text-lg sm:text-xl font-bold flex items-center justify-center gap-0.5 sm:gap-1">
            <Timer size={14} className="text-blue-400" />
            <span>~{estimatedMinutes}min</span>
          </div>
        </div>
      </div>
      
      {ticket.status === 'called' && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-500/30 rounded-lg text-center">
          <MapPin className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-green-500" />
          <p className="font-bold text-green-400 text-sm sm:text-base">
            Dirija-se ao balcão!
          </p>
        </div>
      )}
      
      {ticket.priority === 'preferencial' && (
        <div className="mt-3 sm:mt-4 text-center">
          <span className="inline-flex items-center gap-1 text-xs sm:text-sm bg-purple-500/20 text-purple-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
            <Star size={12} /> Atendimento Preferencial
          </span>
        </div>
      )}
      
      {/* WhatsApp Button - Always visible when barber has WhatsApp */}
      {ticket.barber_name && ticket.barber_whatsapp && (
        <div className="mt-4 sm:mt-5">
          <Button
            className="w-full bg-success hover:bg-success/90 text-success-foreground gap-2"
            onClick={() => {
              const message = encodeURIComponent(
                `Olá ${ticket.barber_name}! 👋\n\n` +
                `Meu ticket: ${ticket.ticket_number}\n` +
                `${ticket.service_name ? `Serviço: ${ticket.service_name}\n` : ''}` +
                `Status: ${ticket.status === 'waiting' ? 'Aguardando' : ticket.status === 'called' ? 'Chamado' : 'Em atendimento'}\n` +
                `\nEstou acompanhando na fila virtual! 💈`
              );
              window.open(`https://wa.me/55${ticket.barber_whatsapp}?text=${message}`, '_blank');
            }}
          >
            <MessageCircle size={18} />
            Falar com {ticket.barber_name} no WhatsApp
          </Button>
        </div>
      )}
      
      {/* Barber info when no WhatsApp available */}
      {ticket.barber_name && !ticket.barber_whatsapp && (
        <div className="mt-3 sm:mt-4 text-center">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Barbeiro: <span className="text-foreground font-medium">{ticket.barber_name}</span>
          </span>
        </div>
      )}
    </div>
  );
};
