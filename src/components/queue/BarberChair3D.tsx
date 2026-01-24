import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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

        {/* Status Indicator */}
        <motion.div
          className={cn(
            'absolute -top-1 -right-1 sm:top-0 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shadow-xl border-2 border-background',
            isStarting && 'bg-success text-success-foreground',
            isInProgress && 'bg-primary text-primary-foreground'
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
          // In progress status - original format
          <>
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {firstName}
            </div>
            {barber && (
              <div className="text-sm text-muted-foreground mt-1">
                com <span className="text-primary font-medium">{barber.display_name}</span>
              </div>
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
