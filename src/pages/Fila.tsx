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
import { getMyTicket, clearMyTicket, validateStoredTicket } from '@/lib/antiAbuse';
import { requestNotificationPermission } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2 } from 'lucide-react';

const Fila = () => {
  const [myTicketId, setMyTicketId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  
  // Enable realtime updates for settings only (barbers uses polling for reliability)
  useQueueSettingsRealtime();
  
  // Check and validate existing ticket on mount
  useEffect(() => {
    const validateTicket = async () => {
      setIsValidating(true);
      const validTicketId = await validateStoredTicket(supabase);
      setMyTicketId(validTicketId);
      
      if (validTicketId) {
        // Request notification permission
        requestNotificationPermission();
      }
      setIsValidating(false);
    };
    
    validateTicket();
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
          
          {/* Main Content - My Ticket or Join (FIRST) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-5 sm:mb-6"
          >
            {isValidating ? (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl sm:rounded-2xl backdrop-blur-sm shadow-lg max-w-md mx-auto">
                <Loader2 size={28} className="text-primary animate-spin mb-3" />
                <p className="text-muted-foreground text-sm">Verificando...</p>
              </div>
            ) : myTicketId ? (
              <div className="max-w-lg mx-auto">
                <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl sm:rounded-2xl backdrop-blur-sm shadow-lg max-w-md mx-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users size={24} className="text-primary" />
                </div>
                <p className="text-muted-foreground mb-5 text-center text-sm sm:text-base max-w-xs">
                  Clique no botão abaixo para entrar na fila virtual e ser atendido
                </p>
                <QueueJoinButton onSuccess={handleJoinSuccess} />
              </div>
            )}
          </motion.div>
          
          {/* Queue List (AFTER Join Section = "Fila Atual" after "Fila Aberta") */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <PublicQueueList />
          </motion.div>
        </div>
      </main>
      
      {/* SEO */}
      <title>Fila Virtual - Brutos Barbearia</title>
    </div>
  );
};

export default Fila;
