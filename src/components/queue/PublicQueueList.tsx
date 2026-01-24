import { usePublicQueue } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';
import { getMyTicket } from '@/lib/antiAbuse';

export const PublicQueueList = () => {
  const { data: queue, isLoading } = usePublicQueue();
  const myTicketId = getMyTicket();
  
  // Filter to show only waiting and called tickets (already filtered by function, but keep for safety)
  const activeQueue = queue?.filter(q => 
    q.status === 'waiting' || q.status === 'called' || q.status === 'in_progress'
  ).slice(0, 15) || [];
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h3 className="font-display text-lg sm:text-xl uppercase mb-3 sm:mb-4 text-center">Fila Atual</h3>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 sm:h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <h3 className="font-display text-lg sm:text-xl uppercase mb-3 sm:mb-4 text-center">Fila Atual</h3>
      
      {activeQueue.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base">
          Nenhum cliente na fila. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {activeQueue.map((item, index) => {
            const isMe = item.id === myTicketId;
            const isCalled = item.status === 'called';
            const isInProgress = item.status === 'in_progress';
            
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between p-2 sm:p-3 rounded-lg transition-all duration-300',
                  isMe && 'ring-2 ring-primary bg-primary/10',
                  isCalled && 'bg-green-500/20 animate-pulse',
                  isInProgress && 'bg-blue-500/20',
                  !isMe && !isCalled && !isInProgress && 'bg-background/50'
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className={cn(
                    'text-base sm:text-xl font-bold flex-shrink-0',
                    isCalled && 'text-green-500',
                    isInProgress && 'text-blue-500',
                    !isCalled && !isInProgress && 'text-primary'
                  )}>
                    {item.ticket_number}
                  </span>
                  
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">
                    {item.customer_name_masked}
                    {isMe && <span className="text-primary ml-1">(você)</span>}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {item.priority === 'preferencial' && (
                    <span className="text-[10px] sm:text-xs bg-purple-500/20 text-purple-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                      ⭐
                    </span>
                  )}
                  
                  {isCalled && (
                    <span className="text-[10px] sm:text-xs bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold animate-bounce">
                      CHAMANDO
                    </span>
                  )}
                  
                  {isInProgress && (
                    <span className="text-[10px] sm:text-xs bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold">
                      ATENDENDO
                    </span>
                  )}
                  
                  {!isCalled && !isInProgress && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
