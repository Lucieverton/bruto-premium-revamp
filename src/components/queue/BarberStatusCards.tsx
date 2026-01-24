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
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-32 h-20 bg-muted animate-pulse rounded-lg"
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
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <User size={14} />
        Barbeiros
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {sortedBarbers.map((barber) => {
          const status = ((barber as { status?: BarberStatus }).status || 'offline') as BarberStatus;
          const config = statusConfig[status];
          
          return (
            <div
              key={barber.id}
              className={cn(
                'flex-shrink-0 rounded-lg border p-3 min-w-[120px] transition-all duration-300',
                config.bgColor,
                status === 'online' && 'shadow-[0_0_15px_rgba(34,197,94,0.2)]'
              )}
            >
              {/* Avatar placeholder */}
              <div className="relative mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-primary">
                    {barber.display_name.charAt(0)}
                  </span>
                </div>
                
                {/* Status dot */}
                <div
                  className={cn(
                    'absolute bottom-0 right-1/2 translate-x-5 w-3 h-3 rounded-full border-2 border-background',
                    status === 'online' && 'bg-green-500',
                    status === 'away' && 'bg-yellow-500',
                    status === 'offline' && 'bg-muted-foreground'
                  )}
                />
              </div>
              
              <div className="text-center">
                <div className="font-medium text-sm truncate">
                  {barber.display_name.split(' ')[0]}
                </div>
                <div className={cn('text-xs flex items-center justify-center gap-1 mt-1', config.color)}>
                  {config.icon}
                  {config.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
