import { motion } from 'framer-motion';
import { Clock, Users, Timer, Scissors } from 'lucide-react';
import { useQueueSettings, useQueueStats } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';

export const HeroStatsPanel = () => {
  const { data: settings } = useQueueSettings();
  const { data: stats } = useQueueStats();
  
  const waitingCount = stats?.waiting_count || 0;
  const inProgressCount = stats?.in_progress_count || 0;
  const avgWaitTime = stats?.avg_wait_minutes || 20;
  
  const isQueueOpen = settings?.is_active ?? true;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  return (
    <div className="text-center h-full flex flex-col justify-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wide mb-2">
          <span className="text-primary">Fila Virtual</span>
        </h1>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl uppercase text-foreground">
          Brutos
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-sm mx-auto">
          Sua espera, com estilo.<br />
          Escolha seu barbeiro e entre na fila de casa.
        </p>
      </motion.div>
      
      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-4 mb-4"
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={16} className="text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">{waitingCount}</div>
            <div className="text-xs text-muted-foreground">na fila</div>
          </div>
          
          <div className="text-center border-x border-border/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Scissors size={16} className="text-success" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-success">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground">atendendo</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer size={16} className="text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">~{avgWaitTime}</div>
            <div className="text-xs text-muted-foreground">min espera</div>
          </div>
        </div>
      </motion.div>
      
      {/* Queue Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'rounded-xl p-3 border',
          isQueueOpen 
            ? 'bg-success/10 border-success/30' 
            : 'bg-destructive/10 border-destructive/30'
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            isQueueOpen ? 'bg-success animate-pulse' : 'bg-destructive'
          )} />
          <span className={cn(
            'font-bold text-sm',
            isQueueOpen ? 'text-success' : 'text-destructive'
          )}>
            Fila {isQueueOpen ? 'Aberta' : 'Fechada'}
          </span>
        </div>
        
        {settings && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>Horário: {settings.opening_time} - {settings.closing_time}</span>
            <span>•</span>
            <span>Agora: {currentTime}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
