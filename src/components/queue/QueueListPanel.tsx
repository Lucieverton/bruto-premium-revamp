import { motion, AnimatePresence } from 'framer-motion';
import { User, Scissors, Crown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicQueue } from '@/hooks/useQueue';
import { getMyTicket } from '@/lib/antiAbuse';
import { cn } from '@/lib/utils';
import { QueueSectionCard } from './QueueSectionCard';

// Empty state chair icon
import chairImage from '@/assets/cadeira-chamando.jpeg';

export const QueueListPanel = () => {
  const { data: queue, isLoading } = usePublicQueue();
  const myTicketId = getMyTicket();
  
  const waitingQueue = queue?.filter(q => q.status === 'waiting').slice(0, 15) || [];

  if (isLoading) {
    return (
      <QueueSectionCard 
        title="Visão Geral da Fila Atual" 
        icon={<Crown size={16} className="text-primary" />}
      >
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </QueueSectionCard>
    );
  }

  return (
    <QueueSectionCard 
      title="Visão Geral da Fila Atual" 
      icon={<Crown size={16} className="text-primary" />}
    >
      {waitingQueue.length === 0 ? (
        <div className="text-center py-6">
          {/* Barber Chair Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-muted/30 border border-border/50 flex items-center justify-center"
          >
            <img 
              src={chairImage} 
              alt="Cadeira de barbeiro" 
              className="w-24 h-24 object-contain opacity-60"
            />
          </motion.div>
          <p className="text-muted-foreground text-sm">
            Nenhum cliente na fila.<br />
            <span className="text-primary font-medium">Seja o primeiro a entrar!</span>
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-1 scrollbar-hide">
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
                  }}
                  className={cn(
                    'relative p-3 rounded-lg transition-all duration-300',
                    isMe && 'ring-2 ring-primary bg-primary/10 shadow-md',
                    isFirst && !isMe && 'bg-success/10 border border-success/30',
                    !isMe && !isFirst && 'bg-background/50 border border-border/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Position Badge */}
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                      isFirst ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {isFirst ? <Crown size={14} /> : index + 1}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={cn(
                          'font-medium truncate text-sm',
                          isMe && 'text-primary'
                        )}>
                          {item.customer_name_masked}
                          {isMe && <span className="text-primary ml-1 font-bold">(você)</span>}
                        </span>
                        
                        {item.priority === 'preferencial' && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded flex-shrink-0">
                            ⭐
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {item.service_name && (
                          <span className="flex items-center gap-1 truncate">
                            <Scissors size={10} />
                            {item.service_name}
                          </span>
                        )}
                        {item.barber_name && (
                          <span className="text-primary/70">→ {item.barber_name}</span>
                        )}
                      </div>
                      
                      {isFirst && (
                        <div className={cn(
                          'mt-1 text-xs font-medium',
                          isMe ? 'text-success' : 'text-success/80'
                        )}>
                          {isMe ? '🎉 Você é o próximo!' : 'Próximo a ser chamado'}
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Button for own ticket */}
                    {isMe && item.barber_name && item.barber_whatsapp && (
                      <Button
                        size="sm"
                        className="flex-shrink-0 bg-success hover:bg-success/90 text-success-foreground text-xs gap-1 px-2 h-8"
                        onClick={() => {
                          const message = encodeURIComponent(
                            `Olá ${item.barber_name}! 👋\n\n` +
                            `Estou na fila (${item.ticket_number}) - Posição ${index + 1}\n` +
                            `${item.service_name ? `Serviço: ${item.service_name}\n` : ''}` +
                            `\nAguardando atendimento! 💈`
                          );
                          window.open(`https://wa.me/55${item.barber_whatsapp}?text=${message}`, '_blank');
                        }}
                      >
                        <MessageCircle size={14} />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </QueueSectionCard>
  );
};
