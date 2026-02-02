import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { MyTicketCard } from '@/components/queue/MyTicketCard';
import { BarbersPanel } from '@/components/queue/BarbersPanel';
import { HeroStatsPanel } from '@/components/queue/HeroStatsPanel';
import { QueueListPanel } from '@/components/queue/QueueListPanel';
import { ActiveServicesDisplay } from '@/components/queue/ActiveServicesDisplay';
import { useQueueSettingsRealtime } from '@/hooks/useQueueRealtime';
import { getMyTicket, clearMyTicket, validateStoredTicket } from '@/lib/antiAbuse';
import { requestNotificationPermission } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Fila = () => {
  const [myTicketId, setMyTicketId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  
  useQueueSettingsRealtime();
  
  useEffect(() => {
    const validateTicket = async () => {
      setIsValidating(true);
      const validTicketId = await validateStoredTicket(supabase);
      setMyTicketId(validTicketId);
      
      if (validTicketId) {
        requestNotificationPermission();
      }
      setIsValidating(false);
    };
    
    validateTicket();
  }, []);
  
  const handleJoinSuccess = () => {
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
      
      <main className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Loading State */}
          {isValidating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <Loader2 size={32} className="text-primary animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">Verificando...</p>
            </motion.div>
          ) : (
            <>
              {/* My Ticket Card - Full width when active */}
              {myTicketId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 max-w-lg mx-auto lg:max-w-xl"
                >
                  <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
                </motion.div>
              )}
              
              {/* 3-Column Grid Layout - Desktop */}
              {/* Mobile: Stack vertically, Desktop: 3 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6">
                
                {/* LEFT: Barbers Panel */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-3 order-2 lg:order-1"
                >
                  <BarbersPanel 
                    onJoinSuccess={handleJoinSuccess}
                    hasActiveTicket={!!myTicketId}
                  />
                </motion.div>
                
                {/* CENTER: Hero + Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-5 order-1 lg:order-2"
                >
                  <div className="bg-card border border-border rounded-xl p-6 h-full">
                    <HeroStatsPanel />
                  </div>
                </motion.div>
                
                {/* RIGHT: Queue List Panel */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-4 order-3"
                >
                  <QueueListPanel />
                </motion.div>
              </div>
              
              {/* Active Services - Below the main grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ActiveServicesDisplay />
              </motion.div>
            </>
          )}
        </div>
      </main>
      
      {/* SEO */}
      <title>Fila Virtual - Brutos Barbearia</title>
    </div>
  );
};

export default Fila;
