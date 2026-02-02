import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { usePublicBarbers, useActiveServicesPublic } from '@/hooks/useQueue';
import { QueueSectionCard } from './QueueSectionCard';
import { BarberCard } from './BarberCard';

type BarberStatus = 'online' | 'away' | 'offline' | 'busy';

interface BarbersPanelProps {
  onJoinSuccess: () => void;
  hasActiveTicket: boolean;
}

export const BarbersPanel = ({ onJoinSuccess, hasActiveTicket }: BarbersPanelProps) => {
  const { data: barbers, isLoading } = usePublicBarbers();
  const { data: activeServices } = useActiveServicesPublic();

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

  if (isLoading) {
    return (
      <QueueSectionCard 
        title="Barbeiros Disponíveis" 
        icon={<User size={16} className="text-primary" />}
      >
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl" />
          ))}
        </div>
      </QueueSectionCard>
    );
  }

  return (
    <QueueSectionCard 
      title="Barbeiros Disponíveis" 
      icon={<User size={16} className="text-primary" />}
    >
      <div className="space-y-4 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-1 scrollbar-hide">
        {sortedBarbers.map((barber, index) => (
          <BarberCard
            key={barber.id}
            barber={barber}
            index={index}
            onJoinSuccess={onJoinSuccess}
            hasActiveTicket={hasActiveTicket}
          />
        ))}
      </div>
    </QueueSectionCard>
  );
};
