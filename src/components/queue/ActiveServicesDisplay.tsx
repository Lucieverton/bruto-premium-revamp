import { AnimatePresence, motion } from 'framer-motion';
import { useTodayQueue, useBarbers } from '@/hooks/useQueue';
import { BarberChair3D } from './BarberChair3D';

export const ActiveServicesDisplay = () => {
  const { data: queue } = useTodayQueue();
  const { data: barbers } = useBarbers();
  
  // Get items that are being attended (called or in_progress)
  const activeServices = queue?.filter(
    (q) => q.status === 'called' || q.status === 'in_progress'
  ) || [];

  if (activeServices.length === 0) {
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
            
            return (
              <motion.div
                key={item.id}
                layout
                className="bg-card border border-border rounded-xl p-4"
              >
                <BarberChair3D
                  item={item}
                  barber={barber}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
