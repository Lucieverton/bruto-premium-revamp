import { usePublicBarbers, useActiveServicesPublic } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';
import { User, Wifi, WifiOff, Clock, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

type BarberStatus = 'online' | 'away' | 'offline' | 'busy';

const statusConfig: Record<BarberStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string; dotColor: string }> = {
  online: {
    label: 'Disponível',
    color: 'text-success',
    bgColor: 'bg-gradient-to-br from-success/20 to-success/5 border-success/40',
    dotColor: 'bg-success',
    icon: <Wifi size={12} className="text-success" />,
  },
  busy: {
    label: 'Atendendo',
    color: 'text-destructive',
    bgColor: 'bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/40',
    dotColor: 'bg-destructive',
    icon: <Scissors size={12} className="text-destructive" />,
  },
  away: {
    label: 'Ausente',
    color: 'text-warning',
    bgColor: 'bg-gradient-to-br from-warning/20 to-warning/5 border-warning/40',
    dotColor: 'bg-warning',
    icon: <Clock size={12} className="text-warning" />,
  },
  offline: {
    label: 'Offline',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30 border-border/50',
    dotColor: 'bg-muted-foreground',
    icon: <WifiOff size={12} className="text-muted-foreground" />,
  },
};

export const BarberStatusCards = () => {
  const { data: barbers, isLoading } = usePublicBarbers();
  const { data: activeServices } = useActiveServicesPublic();

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <User size={14} />
          <span>Barbeiros</span>
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 h-24 bg-muted/50 animate-pulse rounded-xl"
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

  // Determine effective status - if barber has active service, they're busy
  const getEffectiveStatus = (barber: typeof barbers[0]): BarberStatus => {
    // If barber has an active service (in_progress), they're always busy
    if (barbersWithActiveService.has(barber.id)) {
      return 'busy';
    }
    // Otherwise use the status from database
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

  return (
    <div className="mb-6">
      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <User size={14} />
        <span>Barbeiros</span>
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {sortedBarbers.map((barber, index) => {
          const status = getEffectiveStatus(barber);
          const config = statusConfig[status];
          
          return (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex-shrink-0 rounded-xl border p-3 min-w-[100px] sm:min-w-[120px] transition-all duration-300 backdrop-blur-sm',
                config.bgColor,
                status === 'online' && 'shadow-[0_0_20px_rgba(34,197,94,0.15)]',
                status === 'busy' && 'shadow-[0_0_20px_rgba(239,68,68,0.15)]'
              )}
            >
              {/* Avatar */}
              <div className="relative mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/50 overflow-hidden flex items-center justify-center mx-auto border-2 border-background shadow-lg">
                  {barber.avatar_url ? (
                    <img
                      src={barber.avatar_url}
                      alt={barber.display_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm sm:text-base font-bold text-primary">
                      {barber.display_name.charAt(0)}
                    </span>
                  )}
                </div>
                
                {/* Status dot with pulse animation for busy */}
                <motion.div
                  className={cn(
                    'absolute bottom-0 right-1/2 translate-x-5 sm:translate-x-6 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-background shadow-sm',
                    config.dotColor
                  )}
                  animate={status === 'busy' ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: status === 'busy' ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm truncate text-foreground">
                  {barber.display_name.split(' ')[0]}
                </div>
                <div className={cn('text-[10px] sm:text-xs flex items-center justify-center gap-1 mt-1', config.color)}>
                  {config.icon}
                  <span>{config.label}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
