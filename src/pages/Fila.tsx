import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { QueueStatus } from '@/components/queue/QueueStatus';
import { QueueJoinButton } from '@/components/queue/QueueJoinButton';
import { MyTicketCard } from '@/components/queue/MyTicketCard';
import { PublicQueueList } from '@/components/queue/PublicQueueList';
import { BarberStatusCards } from '@/components/queue/BarberStatusCards';
import { ActiveServicesDisplay } from '@/components/queue/ActiveServicesDisplay';
import { useQueueSettingsRealtime } from '@/hooks/useQueueRealtime';
import { getMyTicket, clearMyTicket } from '@/lib/antiAbuse';
import { requestNotificationPermission } from '@/lib/notifications';
import { Users } from 'lucide-react';

const Fila = () => {
  const [myTicketId, setMyTicketId] = useState<string | null>(null);
  
  // Enable realtime updates for settings only (barbers uses polling for reliability)
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
    <div className="min-h-[100svh] bg-background text-foreground">
      <QueueHeader />
      
      <main className="py-6 sm:py-8 md:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-10"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase mb-2 sm:mb-3 tracking-wide">
              <span className="text-primary">Fila</span> Virtual
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              Entre na fila de casa e acompanhe em tempo real
            </p>
          </motion.div>
          
          {/* Barbers Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <BarberStatusCards />
          </motion.div>
          
          {/* Active Services with 3D Chair */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ActiveServicesDisplay />
          </motion.div>
          
          {/* Queue Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <QueueStatus />
          </motion.div>
          
          {/* Main Content Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* Left Column - My Ticket or Join */}
            <div>
              {myTicketId ? (
                <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl backdrop-blur-sm shadow-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                    <Users size={28} className="text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-6 text-center text-sm sm:text-base max-w-xs">
                    Clique no botão abaixo para entrar na fila virtual e ser atendido
                  </p>
                  <QueueJoinButton onSuccess={handleJoinSuccess} />
                </div>
              )}
            </div>
            
            {/* Right Column - Queue List */}
            <div>
              <PublicQueueList />
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* SEO */}
      <title>Fila Virtual - Brutos Barbearia</title>
    </div>
  );
};

export default Fila;
