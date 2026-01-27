import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock, Scissors, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { PublicBarber, useActiveServicesPublic } from '@/hooks/useQueue';
import { BarberQueueForm } from './BarberQueueForm';

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

interface BarberQueueCardProps {
  barber: PublicBarber;
  index: number;
  onJoinSuccess: () => void;
  hasActiveTicket: boolean;
}

export const BarberQueueCard = ({ barber, index, onJoinSuccess, hasActiveTicket }: BarberQueueCardProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: activeServices } = useActiveServicesPublic();
  
  // Determine if barber is currently busy (has active service)
  const isBusy = activeServices?.some(service => service.barber_id === barber.id);
  
  const getEffectiveStatus = (): BarberStatus => {
    if (isBusy) return 'busy';
    if (barber.status === 'busy') return 'busy';
    if (barber.status === 'away') return 'away';
    if (barber.is_available && barber.status === 'online') return 'online';
    return 'offline';
  };
  
  const status = getEffectiveStatus();
  const config = statusConfig[status];
  // Allow joining queue if barber is online OR busy (not offline/away) and user has no active ticket
  const canJoinQueue = (status === 'online' || status === 'busy') && !hasActiveTicket;
  
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    onJoinSuccess();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'flex-shrink-0 rounded-lg border p-2.5 sm:p-3 min-w-[120px] sm:min-w-[140px] transition-all duration-300 backdrop-blur-sm',
          config.bgColor,
          status === 'online' && 'shadow-[0_0_15px_rgba(34,197,94,0.1)]',
          status === 'busy' && 'shadow-[0_0_15px_rgba(239,68,68,0.1)]'
        )}
      >
        {/* Compact Header - Avatar + Status in row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-background/50 overflow-hidden flex items-center justify-center border border-background shadow">
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
            
            {/* Status dot */}
            <motion.div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                config.dotColor
              )}
              animate={status === 'busy' ? {
                scale: [1, 1.15, 1],
              } : {}}
              transition={{
                duration: 1.5,
                repeat: status === 'busy' ? Infinity : 0,
                ease: 'easeInOut',
              }}
            />
          </div>
          
          {/* Name + Status */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs sm:text-sm truncate text-foreground leading-tight">
              {barber.display_name.split(' ')[0]}
            </div>
            <div className={cn('text-[10px] sm:text-xs flex items-center gap-1 mt-0.5', config.color)}>
              {config.icon}
              <span className="truncate">{config.label}</span>
            </div>
          </div>
        </div>
        
        {/* Queue Button - Compact */}
        <AnimatePresence>
          {canJoinQueue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                onClick={() => setIsFormOpen(true)}
                size="sm"
                className={cn(
                  'w-full h-7 sm:h-8 group relative overflow-hidden',
                  'bg-gradient-to-br from-[#e8e8e8] via-[#c0c0c0] to-[#a8a8a8]',
                  'text-gray-900 font-semibold text-[10px] sm:text-xs',
                  'shadow-[0_0_10px_rgba(192,192,192,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]',
                  'hover:shadow-[0_0_15px_rgba(220,220,220,0.5)]',
                  'transition-all duration-300',
                  'border border-white/40'
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
                <UserPlus className="w-3 h-3 mr-1 relative z-10" />
                <span className="relative z-10">Entrar</span>
              </Button>
            </motion.div>
          )}
          
          {hasActiveTicket && status === 'online' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[10px] text-muted-foreground"
            >
              Já na fila
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Queue Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8e8e8] to-[#c0c0c0] flex items-center justify-center">
                {barber.avatar_url ? (
                  <img src={barber.avatar_url} alt={barber.display_name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{barber.display_name.charAt(0)}</span>
                )}
              </div>
              Agendar com {barber.display_name.split(' ')[0]}
            </SheetTitle>
          </SheetHeader>
          
          <BarberQueueForm 
            barberId={barber.id}
            barberName={barber.display_name}
            onSuccess={handleFormSuccess} 
          />
        </SheetContent>
      </Sheet>
    </>
  );
};
