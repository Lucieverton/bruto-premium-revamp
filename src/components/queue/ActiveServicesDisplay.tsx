import { AnimatePresence, motion } from 'framer-motion';
import { useActiveServicesPublic, usePublicBarbers } from '@/hooks/useQueue';
import { BarberChair3D } from './BarberChair3D';

export const ActiveServicesDisplay = () => {
  const { data: activeServices } = useActiveServicesPublic();
  const { data: barbers } = usePublicBarbers();

  if (!activeServices || activeServices.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
        ✂️ Atendimentos em Andamento
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {activeServices.map((item) => {
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
                className="bg-card border border-border rounded-xl p-4"
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
