import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QueueSectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}

export const QueueSectionCard = ({ 
  title, 
  icon, 
  children, 
  className,
  headerClassName 
}: QueueSectionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden h-full',
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        'px-4 py-3 border-b border-border/50 bg-muted/30',
        headerClassName
      )}>
        <h2 className="font-display text-sm sm:text-base uppercase tracking-wide text-foreground flex items-center justify-center gap-2">
          {icon}
          {title}
        </h2>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  );
};
