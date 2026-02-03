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
    <div className="text-center h-full flex flex-col justify-center gap-4">
      {/* Stats Grid - Compacto */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/30 border border-border rounded-xl p-3"
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={14} className="text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{waitingCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">na fila</div>
          </div>
          
          <div className="text-center border-x border-border/50 px-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Scissors size={14} className="text-success" />
            </div>
            <div className="text-2xl font-bold text-success">{inProgressCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">atendendo</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer size={14} className="text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">~{avgWaitTime}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">min</div>
          </div>
        </div>
      </motion.div>
      
      {/* Queue Status Bar - Badge com verde mais vibrante */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'rounded-xl p-3 border',
          isQueueOpen 
            ? 'bg-emerald-500/15 border-emerald-500/40' 
            : 'bg-destructive/10 border-destructive/30'
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full shadow-lg',
            isQueueOpen 
              ? 'bg-emerald-400 animate-pulse shadow-emerald-400/50' 
              : 'bg-destructive'
          )} />
          <span className={cn(
            'font-bold text-sm',
            isQueueOpen ? 'text-emerald-400' : 'text-destructive'
          )}>
            {/* Texto simplificado - "Status da Fila" */}
            Status: Fila {isQueueOpen ? 'Aberta' : 'Fechada'}
          </span>
        </div>
        
        {settings && (
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <Clock size={10} />
            <span>{settings.opening_time} - {settings.closing_time}</span>
            <span className="text-border">•</span>
            <span>Agora: {currentTime}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
