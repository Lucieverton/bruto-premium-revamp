import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Scissors } from 'lucide-react';
import cadeiraAtendimento from '@/assets/cadeira-atendimento.png';
import cadeiraChamando from '@/assets/cadeira-chamando.jpeg';

// Simplified item interface for public display (only fields we actually use)
interface DisplayItem {
  id: string;
  ticket_number: string;
  customer_name: string; // First name only for public display
  status: string;
  priority?: string;
  barber_id?: string | null;
  called_at?: string | null;
}

// Simplified barber interface for public display
interface DisplayBarber {
  id: string;
  display_name: string;
  status?: string;
  specialty?: string | null;
  is_available?: boolean;
  avatar_url?: string | null;
}

interface BarberChair3DProps {
  item: DisplayItem;
  barber?: DisplayBarber;
  className?: string;
}

export const BarberChair3D = ({ item, barber, className }: BarberChair3DProps) => {
  const isStarting = item.status === 'called';
  const isInProgress = item.status === 'in_progress';
  
  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!item.called_at) return null;
    const start = new Date(item.called_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    return diff;
  };

  const elapsedMinutes = getElapsedTime();
  
  // Get first name only
  const firstName = item.customer_name.split(' ')[0];

  // Get barber initials for fallback avatar
  const getBarberInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      className={cn(
        'relative',
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Barber Profile with Animated Clipper - Only show during in_progress */}
      {isInProgress && barber && (
        <motion.div
          className="absolute -top-3 -left-3 z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="relative">
            {/* Barber Avatar */}
            <motion.div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-primary bg-gradient-to-br from-primary to-primary/80 shadow-xl overflow-hidden"
              animate={{
                boxShadow: [
                  '0 0 0 0 hsl(var(--primary) / 0.4)',
                  '0 0 0 8px hsl(var(--primary) / 0)',
                  '0 0 0 0 hsl(var(--primary) / 0.4)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {barber.avatar_url ? (
                <img 
                  src={barber.avatar_url} 
                  alt={barber.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {getBarberInitials(barber.display_name)}
                </div>
              )}
            </motion.div>

            {/* Animated Clipper/Scissors Icon */}
            <motion.div
              className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-background"
              animate={{
                rotate: [0, -15, 15, -10, 10, 0],
                scale: [1, 1.1, 1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Scissors className="w-4 h-4 text-white" />
            </motion.div>

            {/* Working Animation Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/50"
              animate={{
                scale: [1, 1.3, 1.5],
                opacity: [0.5, 0.2, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Chair Image - Different image for calling vs in progress */}
      <motion.div
        className="relative mx-auto"
        animate={{
          rotateY: isInProgress ? [0, 3, 0, -3, 0] : 0,
          scale: isStarting ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: isStarting ? 1.5 : 6,
          repeat: (isInProgress || isStarting) ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{ perspective: '1000px' }}
      >
        <img 
          src={isStarting ? cadeiraChamando : cadeiraAtendimento} 
          alt="Cadeira de barbearia"
          className={cn(
            "w-full max-w-[180px] sm:max-w-[200px] mx-auto h-auto drop-shadow-2xl rounded-lg",
            isStarting && "ring-2 ring-success ring-offset-2 ring-offset-background"
          )}
          style={{ 
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
          }}
        />

        {/* Status Indicator - Adjusted position for in_progress */}
        <motion.div
          className={cn(
            'absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shadow-xl border-2 border-background',
            isStarting && 'bg-success text-success-foreground -top-1 -right-1 sm:top-0 sm:right-0',
            isInProgress && 'bg-primary text-primary-foreground -top-1 right-8 sm:top-0 sm:right-10'
          )}
          animate={{
            scale: isStarting ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.8,
            repeat: isStarting ? Infinity : 0,
          }}
        >
          {isStarting ? '📣' : isInProgress ? '✂️' : ''}
        </motion.div>
      </motion.div>

      {/* Client Info */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {isStarting ? (
          // Called status - new message format
          <>
            <motion.div 
              className="font-medium text-success text-sm mb-1"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Obrigado pela preferência!
            </motion.div>
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {firstName}, é a sua vez!
            </div>
            {barber && (
              <motion.div 
                className="mt-2 text-sm bg-success/20 text-success px-4 py-2 rounded-full inline-flex items-center gap-1.5 font-medium"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span className="text-base">💈</span> 
                <span>{barber.display_name} está à sua espera!</span>
              </motion.div>
            )}
          </>
        ) : (
          // In progress status - with barber working animation
          <>
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {firstName}
            </div>
            {barber && (
              <motion.div 
                className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>com</span>
                <span className="text-primary font-semibold">{barber.display_name}</span>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  ✂️
                </motion.span>
              </motion.div>
            )}
            
            {elapsedMinutes !== null && isInProgress && (
              <motion.div
                className="mt-3 text-xs bg-primary/20 text-primary px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-sm">⏱️</span> 
                <span>{elapsedMinutes} min</span>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
