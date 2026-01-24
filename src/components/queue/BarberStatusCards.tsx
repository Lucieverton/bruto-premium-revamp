import { useBarbers } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';
import { User, Wifi, WifiOff, Clock } from 'lucide-react';

type BarberStatus = 'online' | 'away' | 'offline';

const statusConfig: Record<BarberStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  online: {
    label: 'Online',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20 border-green-500/30',
    icon: <Wifi size={14} className="text-green-500" />,
  },
  away: {
    label: 'Ausente',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    icon: <Clock size={14} className="text-yellow-500" />,
  },
  offline: {
    label: 'Offline',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 border-border',
    icon: <WifiOff size={14} className="text-muted-foreground" />,
  },
};

export const BarberStatusCards = () => {
  const { data: barbers, isLoading } = useBarbers();

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

  // Sort: online first, then away, then offline
  const sortedBarbers = [...(barbers || [])].sort((a, b) => {
    const statusOrder = { online: 0, away: 1, offline: 2 };
    const aStatus = (a as { status?: BarberStatus }).status || 'offline';
    const bStatus = (b as { status?: BarberStatus }).status || 'offline';
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
          const status = ((barber as { status?: BarberStatus }).status || 'offline') as BarberStatus;
          const config = statusConfig[status];
          
          return (
            <div
              key={barber.id}
              className={cn(
                'flex-shrink-0 rounded-lg border p-2 sm:p-3 min-w-[80px] sm:min-w-[110px] transition-all duration-300',
                config.bgColor,
                status === 'online' && 'shadow-[0_0_10px_rgba(34,197,94,0.2)]'
              )}
            >
              {/* Avatar placeholder */}
              <div className="relative mb-1.5 sm:mb-2">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <span className="text-xs sm:text-sm font-bold text-primary">
                    {barber.display_name.charAt(0)}
                  </span>
                </div>
                
                {/* Status dot */}
                <div
                  className={cn(
                    'absolute bottom-0 right-1/2 translate-x-4 sm:translate-x-5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-background',
                    status === 'online' && 'bg-green-500',
                    status === 'away' && 'bg-yellow-500',
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
