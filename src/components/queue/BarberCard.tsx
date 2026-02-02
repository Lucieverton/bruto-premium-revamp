import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Clock, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { PublicBarber, useActiveServicesPublic } from '@/hooks/useQueue';
import { BarberQueueForm } from './BarberQueueForm';

type BarberStatus = 'online' | 'away' | 'offline' | 'busy';

const statusConfig: Record<BarberStatus, { label: string; color: string; dotColor: string }> = {
  online: {
    label: 'Disponível',
    color: 'text-success',
    dotColor: 'bg-success',
  },
  busy: {
    label: 'Atendendo',
    color: 'text-destructive',
    dotColor: 'bg-destructive',
  },
  away: {
    label: 'Ausente',
    color: 'text-warning',
    dotColor: 'bg-warning',
  },
  offline: {
    label: 'Offline',
    color: 'text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  },
};

interface BarberCardProps {
  barber: PublicBarber;
  index: number;
  onJoinSuccess: () => void;
  hasActiveTicket: boolean;
}

export const BarberCard = ({ barber, index, onJoinSuccess, hasActiveTicket }: BarberCardProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: activeServices } = useActiveServicesPublic();
  
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
        transition={{ delay: index * 0.1 }}
        className="bg-background/50 rounded-xl p-4 border border-border/50 transition-all duration-300 hover:border-primary/30"
      >
        {/* Large Avatar */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 mb-3">
          <div className="w-full h-full rounded-xl overflow-hidden bg-muted/50 border border-border">
            {barber.avatar_url ? (
              <img
                src={barber.avatar_url}
                alt={barber.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {barber.display_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Name */}
        <h3 className="font-semibold text-base text-center text-foreground mb-1">
          {barber.display_name.split(' ')[0]}
        </h3>
        
        {/* Status */}
        <div className={cn('text-xs flex items-center justify-center gap-1.5 mb-4', config.color)}>
          <motion.span 
            className={cn('w-2 h-2 rounded-full', config.dotColor)}
            animate={status === 'online' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {config.label}
        </div>
        
        {/* Action Button */}
        {canJoinQueue ? (
          <Button
            onClick={() => setIsFormOpen(true)}
            className={cn(
              'w-full relative overflow-hidden group',
              'bg-gradient-to-br from-[#e8e8e8] via-[#c0c0c0] to-[#a8a8a8]',
              'text-gray-900 font-semibold text-sm',
              'shadow-[0_0_10px_rgba(192,192,192,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]',
              'hover:shadow-[0_0_15px_rgba(220,220,220,0.5)]',
              'border border-white/40'
            )}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
            <span className="relative z-10">Entrar</span>
          </Button>
        ) : hasActiveTicket && status !== 'offline' ? (
          <div className="text-center text-xs text-muted-foreground py-2">
            Já na fila
          </div>
        ) : (
          <div className="text-center text-xs text-muted-foreground py-2">
            Indisponível
          </div>
        )}
      </motion.div>
      
      {/* Queue Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8e8e8] to-[#c0c0c0] flex items-center justify-center overflow-hidden">
                {barber.avatar_url ? (
                  <img src={barber.avatar_url} alt={barber.display_name} className="w-full h-full object-cover" />
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
