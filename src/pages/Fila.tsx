import { useState, useEffect } from 'react';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { QueueStatus } from '@/components/queue/QueueStatus';
import { QueueJoinButton } from '@/components/queue/QueueJoinButton';
import { MyTicketCard } from '@/components/queue/MyTicketCard';
import { PublicQueueList } from '@/components/queue/PublicQueueList';
import { BarberStatusCards } from '@/components/queue/BarberStatusCards';
import { ActiveServicesDisplay } from '@/components/queue/ActiveServicesDisplay';
import { useQueueRealtime, useQueueSettingsRealtime, useBarbersRealtime } from '@/hooks/useQueueRealtime';
import { getMyTicket, clearMyTicket } from '@/lib/antiAbuse';
import { requestNotificationPermission } from '@/lib/notifications';

const Fila = () => {
  const [myTicketId, setMyTicketId] = useState<string | null>(null);
  
  // Enable realtime updates
  useQueueRealtime();
  useQueueSettingsRealtime();
  useBarbersRealtime();
  
  // Check for existing ticket on mount
  useEffect(() => {
    const savedTicket = getMyTicket();
    if (savedTicket) {
      setMyTicketId(savedTicket);
      // Request notification permission
      requestNotificationPermission();
    }
  }, []);
  
  const handleJoinSuccess = () => {
    const savedTicket = getMyTicket();
    setMyTicketId(savedTicket);
  };
  
  const handleLeave = () => {
    clearMyTicket();
    setMyTicketId(null);
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <QueueHeader />
      
      <main className="py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase mb-1 sm:mb-2">
              Fila Virtual
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Entre na fila de casa e acompanhe em tempo real
            </p>
          </div>
          
          {/* Barbers Status */}
          <BarberStatusCards />
          
          {/* Active Services with 3D Chair */}
          <ActiveServicesDisplay />
          
          <QueueStatus />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              {myTicketId ? (
                <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground mb-6 text-center">
                    Clique no botão abaixo para entrar na fila virtual
                  </p>
                  <QueueJoinButton onSuccess={handleJoinSuccess} />
                </div>
              )}
            </div>
            
            <div>
              <PublicQueueList />
            </div>
          </div>
        </div>
      </main>
      
      {/* SEO */}
      <title>Fila Virtual - Brutos Barbearia</title>
    </div>
  );
};

export default Fila;
