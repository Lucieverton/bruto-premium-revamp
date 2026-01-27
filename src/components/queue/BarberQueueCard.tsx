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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          'flex-shrink-0 rounded-xl border p-4 min-w-[160px] sm:min-w-[180px] transition-all duration-300 backdrop-blur-sm',
          config.bgColor,
          status === 'online' && 'shadow-[0_0_20px_rgba(34,197,94,0.15)]',
          status === 'busy' && 'shadow-[0_0_20px_rgba(239,68,68,0.15)]'
        )}
      >
        {/* Avatar */}
        <div className="relative mb-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background/50 overflow-hidden flex items-center justify-center mx-auto border-2 border-background shadow-lg">
            {barber.avatar_url ? (
              <img
                src={barber.avatar_url}
                alt={barber.display_name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg sm:text-xl font-bold text-primary">
                {barber.display_name.charAt(0)}
              </span>
            )}
          </div>
          
          {/* Status dot */}
          <motion.div
            className={cn(
              'absolute bottom-0 right-1/2 translate-x-7 sm:translate-x-8 w-4 h-4 rounded-full border-2 border-background shadow-sm',
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
        
        {/* Info */}
        <div className="text-center mb-3">
          <div className="font-semibold text-sm sm:text-base truncate text-foreground">
            {barber.display_name.split(' ')[0]}
          </div>
          <div className={cn('text-xs flex items-center justify-center gap-1 mt-1', config.color)}>
            {config.icon}
            <span>{config.label}</span>
          </div>
        </div>
        
        {/* Queue Button */}
        <AnimatePresence>
          {canJoinQueue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => setIsFormOpen(true)}
                size="sm"
                className={cn(
                  'w-full group relative overflow-hidden',
                  'bg-gradient-to-br from-[#e8e8e8] via-[#c0c0c0] to-[#a8a8a8]',
                  'text-gray-900 font-semibold text-xs',
                  'shadow-[0_0_15px_rgba(192,192,192,0.4),inset_0_1px_0_rgba(255,255,255,0.4)]',
                  'hover:shadow-[0_0_25px_rgba(220,220,220,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]',
                  'transition-all duration-300',
                  'border border-white/40'
                )}
              >
                {/* Shine effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
                
                <UserPlus className="w-3.5 h-3.5 mr-1.5 relative z-10" />
                <span className="relative z-10">Minha Fila</span>
                <Sparkles className="w-3 h-3 ml-1 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
          )}
          
          {hasActiveTicket && status === 'online' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-muted-foreground mt-1"
            >
              Você já está na fila
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
