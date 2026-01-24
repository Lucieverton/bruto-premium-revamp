import { motion, AnimatePresence } from 'framer-motion';
import { QueueItem, Barber } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';

interface BarberChair3DProps {
  item: QueueItem;
  barber?: Barber;
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

  return (
    <motion.div
      className={cn(
        'relative perspective-1000 transform-style-preserve-3d',
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* 3D Barber Chair SVG */}
      <motion.div
        className="relative"
        animate={{
          rotateY: isInProgress ? [0, 5, 0, -5, 0] : 0,
        }}
        transition={{
          duration: 4,
          repeat: isInProgress ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <svg
          viewBox="0 0 120 140"
          className="w-full h-auto drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
        >
          {/* Chair Base */}
          <motion.ellipse
            cx="60"
            cy="130"
            rx="45"
            ry="8"
            fill="hsl(var(--muted))"
            initial={{ scaleX: 0.8 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Chair Stand */}
          <motion.rect
            x="52"
            y="90"
            width="16"
            height="40"
            rx="4"
            fill="url(#metalGradient)"
            initial={{ height: 0, y: 130 }}
            animate={{ height: 40, y: 90 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          
          {/* Seat */}
          <motion.path
            d="M20 75 Q20 90 60 90 Q100 90 100 75 L95 70 Q60 75 25 70 Z"
            fill="url(#leatherGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
          
          {/* Backrest */}
          <motion.path
            d="M25 70 Q25 25 60 20 Q95 25 95 70 L85 68 Q60 40 35 68 Z"
            fill="url(#leatherGradient)"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
          
          {/* Armrests */}
          <motion.rect
            x="10"
            y="65"
            width="20"
            height="8"
            rx="4"
            fill="url(#metalGradient)"
            initial={{ x: 30 }}
            animate={{ x: 10 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          />
          <motion.rect
            x="90"
            y="65"
            width="20"
            height="8"
            rx="4"
            fill="url(#metalGradient)"
            initial={{ x: 70 }}
            animate={{ x: 90 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          />
          
          {/* Footrest */}
          <motion.rect
            x="35"
            y="115"
            width="50"
            height="6"
            rx="3"
            fill="url(#metalGradient)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C0C0C0" />
              <stop offset="50%" stopColor="#808080" />
              <stop offset="100%" stopColor="#A0A0A0" />
            </linearGradient>
            <linearGradient id="leatherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--primary) / 0.8)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Status Indicator */}
        <motion.div
          className={cn(
            'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg',
            isStarting && 'bg-green-500 text-white',
            isInProgress && 'bg-blue-500 text-white'
          )}
          animate={{
            scale: isStarting ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: isStarting ? Infinity : 0,
          }}
        >
          {isStarting ? '!' : isInProgress ? '✂️' : ''}
        </motion.div>
      </motion.div>

      {/* Client Info */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="font-bold text-lg">{item.customer_name.split(' ')[0]}</div>
        {barber && (
          <div className="text-sm text-muted-foreground">
            com <span className="text-primary">{barber.display_name}</span>
          </div>
        )}
        
        {elapsedMinutes !== null && isInProgress && (
          <motion.div
            className="mt-2 text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full inline-block"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⏱️ {elapsedMinutes} min
          </motion.div>
        )}
        
        {isStarting && (
          <motion.div
            className="mt-2 text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full inline-block"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Chamando...
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
