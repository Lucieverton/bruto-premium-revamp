import { usePublicQueue } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';
import { getMyTicket } from '@/lib/antiAbuse';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Scissors, Crown } from 'lucide-react';

export const PublicQueueList = () => {
  const { data: queue, isLoading } = usePublicQueue();
  const myTicketId = getMyTicket();
  
  // Filter to show only waiting tickets (called/in_progress are shown in ActiveServices)
  const waitingQueue = queue?.filter(q => q.status === 'waiting').slice(0, 15) || [];
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h3 className="font-display text-lg sm:text-xl uppercase mb-3 sm:mb-4 text-center">Fila Atual</h3>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
      <h3 className="font-display text-base sm:text-lg uppercase mb-3 text-center">Fila Atual</h3>
      
      {waitingQueue.length === 0 ? (
        <p className="text-center text-muted-foreground py-4 sm:py-6 text-sm">
          Nenhum cliente na fila. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          <AnimatePresence mode="popLayout">
            {waitingQueue.map((item, index) => {
              const isMe = item.id === myTicketId;
              const isFirst = index === 0;
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    layout: { type: 'spring', stiffness: 200, damping: 25 }
                  }}
                  className={cn(
                    'relative p-2.5 sm:p-3 rounded-lg transition-all duration-300',
                    isMe && 'ring-2 ring-primary bg-primary/10 shadow-md',
                    isFirst && !isMe && 'bg-success/10 border border-success/30',
                    !isMe && !isFirst && 'bg-background/50 border border-border/50'
                  )}
                >
                  {/* Position Badge */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Order Number */}
                    <div className={cn(
                      'flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm',
                      isFirst ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {isFirst ? (
                        <Crown size={14} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name Row */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                        <User size={12} className="text-muted-foreground flex-shrink-0" />
                        <span className={cn(
                          'font-medium truncate text-xs sm:text-sm',
                          isMe && 'text-primary'
                        )}>
                          {item.customer_name_masked}
                          {isMe && <span className="text-primary ml-1 font-bold">(você)</span>}
                        </span>
                        
                        {item.priority === 'preferencial' && (
                          <span className="text-[9px] sm:text-[10px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded flex-shrink-0">
                            ⭐ Pref.
                          </span>
                        )}
                      </div>
                      
                      {/* Service & Barber Row */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
                        {item.service_name && (
                          <span className="flex items-center gap-1">
                            <Scissors size={10} />
                            <span className="truncate max-w-[100px] sm:max-w-none">{item.service_name}</span>
                          </span>
                        )}
                        
                        {item.barber_name && (
                          <span className="flex items-center gap-1 text-primary/70">
                            → {item.barber_name}
                          </span>
                        )}
                      </div>
                      
                      {/* First Position Message */}
                      {isFirst && isMe && (
                        <motion.div 
                          className="mt-1.5 text-[10px] sm:text-xs font-bold text-success"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          🎉 Você será o próximo!
                        </motion.div>
                      )}
                      
                      {isFirst && !isMe && (
                        <motion.div 
                          className="mt-1.5 text-[10px] sm:text-xs font-medium text-success/80"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Próximo a ser chamado
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
