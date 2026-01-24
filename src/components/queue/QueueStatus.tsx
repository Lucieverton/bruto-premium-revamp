import { Clock, Users, Timer } from 'lucide-react';
import { useQueueSettings, useTodayQueue } from '@/hooks/useQueue';

export const QueueStatus = () => {
  const { data: settings } = useQueueSettings();
  const { data: queue } = useTodayQueue();
  
  const waitingCount = queue?.filter(q => q.status === 'waiting').length || 0;
  const avgWaitTime = waitingCount * 20; // Estimate 20 min per client
  
  const isOpen = settings?.is_active ?? true;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  const isWithinHours = settings 
    ? currentTime >= settings.opening_time && currentTime < settings.closing_time
    : true;
  
  const isQueueOpen = isOpen && isWithinHours;

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isQueueOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`font-bold text-base sm:text-lg ${isQueueOpen ? 'text-green-500' : 'text-red-500'}`}>
            Fila {isQueueOpen ? 'Aberta' : 'Fechada'}
          </span>
        </div>
        
        {settings && (
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock size={14} />
              <span>{settings.opening_time} - {settings.closing_time}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="text-[10px] sm:text-xs bg-muted px-2 py-0.5 rounded">Agora: {currentTime}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-background/50 rounded-lg p-3 sm:p-4 text-center">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-primary" />
          <div className="text-2xl sm:text-3xl font-bold text-primary">{waitingCount}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">na fila</div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 sm:p-4 text-center">
          <Timer className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-primary" />
          <div className="text-2xl sm:text-3xl font-bold text-primary">~{avgWaitTime}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">min de espera</div>
        </div>
      </div>
    </div>
  );
};
