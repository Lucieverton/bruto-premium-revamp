import { usePublicBarbers, useActiveServicesPublic } from '@/hooks/useQueue';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarberQueueCard } from './BarberQueueCard';

type BarberStatus = 'online' | 'away' | 'offline' | 'busy';

interface BarberSelectionGridProps {
  onJoinSuccess: () => void;
  hasActiveTicket: boolean;
}

export const BarberSelectionGrid = ({ onJoinSuccess, hasActiveTicket }: BarberSelectionGridProps) => {
  const { data: barbers, isLoading } = usePublicBarbers();
  const { data: activeServices } = useActiveServicesPublic();

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <User size={16} />
          <span>Escolha seu Barbeiro</span>
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-44 h-48 bg-muted/50 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  // Create a map of barbers with active services
  const barbersWithActiveService = new Set(
    activeServices?.map(service => service.barber_id) || []
  );

  // Determine effective status
  const getEffectiveStatus = (barber: typeof barbers[0]): BarberStatus => {
    if (barbersWithActiveService.has(barber.id)) return 'busy';
    if (barber.status === 'busy') return 'busy';
    if (barber.status === 'away') return 'away';
    if (barber.is_available && barber.status === 'online') return 'online';
    return 'offline';
  };

  // Sort: online first, then busy, then away, then offline
  const sortedBarbers = [...(barbers || [])].sort((a, b) => {
    const statusOrder = { online: 0, busy: 1, away: 2, offline: 3 };
    const aStatus = getEffectiveStatus(a);
    const bStatus = getEffectiveStatus(b);
    return statusOrder[aStatus] - statusOrder[bStatus];
  });

  // Count online barbers
  const onlineCount = sortedBarbers.filter(b => getEffectiveStatus(b) === 'online').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <User size={16} />
          <span>Escolha seu Barbeiro</span>
        </h3>
        {onlineCount > 0 && (
          <span className="text-xs text-success flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {onlineCount} disponível{onlineCount > 1 ? 'is' : ''}
          </span>
        )}
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {sortedBarbers.map((barber, index) => (
          <BarberQueueCard
            key={barber.id}
            barber={barber}
            index={index}
            onJoinSuccess={onJoinSuccess}
            hasActiveTicket={hasActiveTicket}
          />
        ))}
      </div>
      
      {!hasActiveTicket && onlineCount > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-center text-muted-foreground mt-4"
        >
          Clique em "Minha Fila" para escolher seu serviço e entrar na fila
        </motion.p>
      )}
    </motion.div>
  );
};
