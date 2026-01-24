import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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

// Animated Hair Clipper SVG Component
const AnimatedClipper = () => (
  <motion.svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    animate={{
      x: [0, 2, -2, 1, -1, 0],
      rotate: [0, -5, 5, -3, 3, 0],
    }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    {/* Clipper body */}
    <motion.rect
      x="4"
      y="6"
      width="16"
      height="10"
      rx="2"
      fill="hsl(var(--primary))"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="0.5"
    />
    {/* Clipper blade */}
    <motion.rect
      x="2"
      y="8"
      width="4"
      height="6"
      rx="1"
      fill="hsl(var(--muted-foreground))"
      animate={{
        y: [8, 7.5, 8.5, 8],
      }}
      transition={{
        duration: 0.15,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
    {/* Blade teeth */}
    <motion.path
      d="M2 9.5h2M2 11h2M2 12.5h2"
      stroke="hsl(var(--background))"
      strokeWidth="0.5"
      animate={{
        y: [0, -0.5, 0.5, 0],
      }}
      transition={{
        duration: 0.15,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
    {/* Handle */}
    <rect x="8" y="16" width="8" height="3" rx="1" fill="hsl(var(--muted))" />
    {/* Power button */}
    <circle cx="12" cy="11" r="1.5" fill="hsl(var(--success))" />
    <motion.circle
      cx="12"
      cy="11"
      r="1.5"
      fill="hsl(var(--success))"
      animate={{
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
      }}
    />
  </motion.svg>
);

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

  // Called status - show chair image with calling message
  if (isStarting) {
    return (
      <motion.div
        className={cn('relative', className)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="relative mx-auto"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img 
            src={cadeiraChamando} 
            alt="Cadeira de barbearia"
            className="w-full max-w-[180px] sm:max-w-[200px] mx-auto h-auto drop-shadow-2xl rounded-lg ring-2 ring-success ring-offset-2 ring-offset-background"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
          />
          <motion.div
            className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-success text-success-foreground flex items-center justify-center text-lg font-bold shadow-xl border-2 border-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            📣
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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
        </motion.div>
      </motion.div>
    );
  }

  // In Progress status - clean card without background image
  return (
    <motion.div
      className={cn('relative flex flex-col items-center', className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Barber Profile with Animated Ring */}
      {barber && (
        <div className="relative mb-4">
          {/* Animated outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            animate={{
              scale: [1, 1.2, 1.4],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            style={{ width: '80px', height: '80px', top: '-4px', left: '-4px' }}
          />
          
          {/* Barber Avatar */}
          <motion.div
            className="w-[72px] h-[72px] rounded-full border-3 border-primary bg-gradient-to-br from-primary to-primary/80 shadow-xl overflow-hidden"
            animate={{
              boxShadow: [
                '0 0 0 0 hsl(var(--primary) / 0.4)',
                '0 0 0 10px hsl(var(--primary) / 0)',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {barber.avatar_url ? (
              <img 
                src={barber.avatar_url} 
                alt={barber.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                {getBarberInitials(barber.display_name)}
              </div>
            )}
          </motion.div>

          {/* Animated Clipper Icon */}
          <motion.div
            className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 shadow-lg border border-border"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <AnimatedClipper />
          </motion.div>
        </div>
      )}

      {/* Client & Barber Info */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Client Name */}
        <div className="font-display text-xl font-bold text-foreground mb-1">
          {firstName}
        </div>

        {/* Barber Name */}
        {barber && (
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <span>com</span>
            <span className="text-primary font-semibold">{barber.display_name}</span>
          </div>
        )}
        
        {/* Elapsed Time */}
        {elapsedMinutes !== null && (
          <motion.div
            className="mt-3 text-xs bg-primary/15 text-primary px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>⏱️</span> 
            <span>{elapsedMinutes} min</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
