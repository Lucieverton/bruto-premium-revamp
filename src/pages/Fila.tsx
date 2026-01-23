import { useState, useEffect } from 'react';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { QueueStatus } from '@/components/queue/QueueStatus';
import { QueueJoinForm } from '@/components/queue/QueueJoinForm';
import { MyTicketCard } from '@/components/queue/MyTicketCard';
import { PublicQueueList } from '@/components/queue/PublicQueueList';
import { useQueueRealtime, useQueueSettingsRealtime } from '@/hooks/useQueueRealtime';
import { getMyTicket, clearMyTicket } from '@/lib/antiAbuse';
import { requestNotificationPermission } from '@/lib/notifications';

const Fila = () => {
  const [myTicketId, setMyTicketId] = useState<string | null>(null);
  
  // Enable realtime updates
  useQueueRealtime();
  useQueueSettingsRealtime();
  
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
    <div className="min-h-screen bg-background text-foreground">
      <QueueHeader />
      
      <main className="py-8 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl uppercase mb-2">
              Fila Virtual
            </h1>
            <p className="text-muted-foreground">
              Entre na fila de casa e acompanhe em tempo real
            </p>
          </div>
          
          <QueueStatus />
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {myTicketId ? (
                <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
              ) : (
                <QueueJoinForm onSuccess={handleJoinSuccess} />
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
