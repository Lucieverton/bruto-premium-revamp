import { usePublicBarbers } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';
import { User, Wifi, WifiOff, Clock, Scissors } from 'lucide-react';

type BarberStatus = 'online' | 'away' | 'offline' | 'busy';

const statusConfig: Record<BarberStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  online: {
    label: 'Disponível',
    color: 'text-success',
    bgColor: 'bg-success/15 border-success/30',
    icon: <Wifi size={14} className="text-success" />,
  },
  busy: {
    label: 'Atendendo',
    color: 'text-destructive',
    bgColor: 'bg-destructive/15 border-destructive/30',
    icon: <Scissors size={14} className="text-destructive" />,
  },
  away: {
    label: 'Ausente',
    color: 'text-warning',
    bgColor: 'bg-warning/15 border-warning/30',
    icon: <Clock size={14} className="text-warning" />,
  },
  offline: {
    label: 'Offline',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 border-border',
    icon: <WifiOff size={14} className="text-muted-foreground" />,
  },
};

export const BarberStatusCards = () => {
  const { data: barbers, isLoading } = usePublicBarbers();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-20 sm:w-28 h-16 sm:h-20 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  // Sort: online first, then busy, then away, then offline
  const sortedBarbers = [...(barbers || [])].sort((a, b) => {
    const statusOrder = { online: 0, busy: 1, away: 2, offline: 3 };
    const aStatus = ((a.status === 'busy') ? 'busy' : (a.is_available ? 'online' : 'offline')) as BarberStatus;
    const bStatus = ((b.status === 'busy') ? 'busy' : (b.is_available ? 'online' : 'offline')) as BarberStatus;
    return statusOrder[aStatus] - statusOrder[bStatus];
  });

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
        <User size={12} />
        Barbeiros
      </h3>
      
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {sortedBarbers.map((barber) => {
          // Rule: if the toggle is ON, never show "offline"; only switch to "busy" when in service
          const status = ((barber.status === 'busy') ? 'busy' : (barber.is_available ? 'online' : 'offline')) as BarberStatus;
          const config = statusConfig[status];
          
          return (
            <div
              key={barber.id}
              className={cn(
                'flex-shrink-0 rounded-lg border p-2 sm:p-3 min-w-[80px] sm:min-w-[110px] transition-all duration-300',
                config.bgColor,
                status === 'online' && 'ring-1 ring-success/30',
                status === 'busy' && 'ring-1 ring-destructive/30'
              )}
            >
              {/* Avatar placeholder */}
              <div className="relative mb-1.5 sm:mb-2">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center mx-auto">
                  {barber.avatar_url ? (
                    <img
                      src={barber.avatar_url}
                      alt={`Foto de perfil de ${barber.display_name}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-primary">
                      {barber.display_name.charAt(0)}
                    </span>
                  )}
                </div>
                
                {/* Status dot */}
                <div
                  className={cn(
                    'absolute bottom-0 right-1/2 translate-x-4 sm:translate-x-5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-background',
                    status === 'online' && 'bg-success',
                    status === 'busy' && 'bg-destructive animate-pulse',
                    status === 'away' && 'bg-warning',
                    status === 'offline' && 'bg-muted-foreground'
                  )}
                />
              </div>
              
              <div className="text-center">
                <div className="font-medium text-xs sm:text-sm truncate">
                  {barber.display_name.split(' ')[0]}
                </div>
                <div className={cn('text-[10px] sm:text-xs flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1', config.color)}>
                  {config.icon}
                  <span className="hidden sm:inline">{config.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
