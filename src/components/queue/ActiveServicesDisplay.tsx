import { AnimatePresence, motion } from 'framer-motion';
import { useActiveServicesPublic, usePublicBarbers } from '@/hooks/useQueue';
import { BarberChair3D } from './BarberChair3D';
import { Scissors } from 'lucide-react';

export const ActiveServicesDisplay = () => {
  const { data: activeServices } = useActiveServicesPublic();
  const { data: barbers } = usePublicBarbers();

  if (!activeServices || activeServices.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 sm:mb-8">
      <motion.h3 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-medium text-muted-foreground mb-4 sm:mb-5 text-center flex items-center justify-center gap-2"
      >
        <Scissors size={16} className="text-primary" />
        <span>Atendimentos em Andamento</span>
      </motion.h3>
      
      {/* Grid layout: 2 columns on mobile, 2-4 columns on larger screens */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {activeServices.map((item, index) => {
            const barber = barbers?.find((b) => b.id === item.barber_id);
            
            // Create a compatible object for BarberChair3D using only public data
            const displayItem = {
              id: item.id,
              ticket_number: item.ticket_number,
              customer_name: item.customer_first_name, // Only first name (masked by RPC)
              status: item.service_status,
              priority: item.priority,
              barber_id: item.barber_id,
              called_at: item.started_at,
            };
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 backdrop-blur-sm shadow-lg"
              >
                <BarberChair3D
                  item={displayItem}
                  barber={barber || undefined}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};