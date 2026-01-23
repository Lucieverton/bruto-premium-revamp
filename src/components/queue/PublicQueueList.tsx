import { useTodayQueue } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';
import { getMyTicket } from '@/lib/antiAbuse';

export const PublicQueueList = () => {
  const { data: queue, isLoading } = useTodayQueue();
  const myTicketId = getMyTicket();
  
  // Filter to show only waiting and called tickets
  const activeQueue = queue?.filter(q => 
    q.status === 'waiting' || q.status === 'called' || q.status === 'in_progress'
  ).slice(0, 15) || [];
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-display text-xl uppercase mb-4 text-center">Fila Atual</h3>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-display text-xl uppercase mb-4 text-center">Fila Atual</h3>
      
      {activeQueue.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum cliente na fila. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-2">
          {activeQueue.map((item, index) => {
            const isMe = item.id === myTicketId;
            const isCalled = item.status === 'called';
            const isInProgress = item.status === 'in_progress';
            
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg transition-all duration-300',
                  isMe && 'ring-2 ring-primary bg-primary/10',
                  isCalled && 'bg-green-500/20 animate-pulse',
                  isInProgress && 'bg-blue-500/20',
                  !isMe && !isCalled && !isInProgress && 'bg-background/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-xl font-bold',
                    isCalled && 'text-green-500',
                    isInProgress && 'text-blue-500',
                    !isCalled && !isInProgress && 'text-primary'
                  )}>
                    {item.ticket_number}
                  </span>
                  
                  <span className="text-muted-foreground">
                    {item.customer_name.split(' ')[0]}
                    {isMe && <span className="text-primary ml-1">(você)</span>}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {item.priority === 'preferencial' && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                      ⭐
                    </span>
                  )}
                  
                  {isCalled && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold animate-bounce">
                      CHAMANDO
                    </span>
                  )}
                  
                  {isInProgress && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold">
                      ATENDENDO
                    </span>
                  )}
                  
                  {!isCalled && !isInProgress && (
                    <span className="text-xs text-muted-foreground">
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
