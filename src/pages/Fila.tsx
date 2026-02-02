import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { QueueStatus } from '@/components/queue/QueueStatus';
import { MyTicketCard } from '@/components/queue/MyTicketCard';
import { PublicQueueList } from '@/components/queue/PublicQueueList';
import { BarberSelectionGrid } from '@/components/queue/BarberSelectionGrid';
import { ActiveServicesDisplay } from '@/components/queue/ActiveServicesDisplay';
import { useQueueSettingsRealtime } from '@/hooks/useQueueRealtime';
import { getMyTicket, clearMyTicket, validateStoredTicket } from '@/lib/antiAbuse';
import { requestNotificationPermission } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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
    // Small delay to ensure localStorage was saved by the mutation
    setTimeout(() => {
      const savedTicket = getMyTicket();
      setMyTicketId(savedTicket);
    }, 100);
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
              Escolha seu barbeiro e entre na fila de casa
            </p>
          </motion.div>
          
          {/* Loading State */}
          {isValidating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-8 mb-6"
            >
              <Loader2 size={32} className="text-primary animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">Verificando...</p>
            </motion.div>
          ) : (
            <>
              {/* My Ticket (if exists) */}
              {myTicketId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 max-w-lg mx-auto"
                >
                  <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
                </motion.div>
              )}
              
              {/* Barber Selection Grid with "Minha Fila" buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <BarberSelectionGrid 
                  onJoinSuccess={handleJoinSuccess}
                  hasActiveTicket={!!myTicketId}
                />
              </motion.div>
            </>
          )}
          
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
          
          {/* Queue List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
