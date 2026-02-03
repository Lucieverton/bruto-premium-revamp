import { AnimatePresence, motion } from 'framer-motion';
import { useActiveServicesPublic, usePublicBarbers } from '@/hooks/useQueue';
import { BarberChair3D } from './BarberChair3D';
import { Scissors, Armchair } from 'lucide-react';

export const ActiveServicesDisplay = () => {
  const { data: activeServices } = useActiveServicesPublic();
  const { data: barbers } = usePublicBarbers();

  // Estado vazio elegante
  if (!activeServices || activeServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Armchair size={48} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum atendimento no momento</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Os clientes em atendimento aparecerão aqui</p>
      </div>
    );
  }

  // Centralização quando há apenas 1 atendimento
  const isSingle = activeServices.length === 1;

  return (
    <div className="w-full">
      {/* Grid responsivo: centraliza quando único, grid quando múltiplos */}
      <div className={
        isSingle 
          ? "flex justify-center" 
          : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
      }>
        <AnimatePresence mode="popLayout">
          {activeServices.map((item, index) => {
            const barber = barbers?.find((b) => b.id === item.barber_id);
            
            const displayItem = {
              id: item.id,
              ticket_number: item.ticket_number,
              customer_name: item.customer_first_name,
              status: item.service_status,
              priority: item.priority,
              barber_id: item.barber_id,
              called_at: item.started_at,
            };
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl p-4 backdrop-blur-sm shadow-md ${isSingle ? 'w-full max-w-xs' : ''}`}
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