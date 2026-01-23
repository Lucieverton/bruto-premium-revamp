import { useTodayQueue } from '@/hooks/useQueue';
import { QueueCard } from './QueueCard';

export const QueueKanban = () => {
  const { data: queue, isLoading } = useTodayQueue();
  
  const waiting = queue?.filter(q => q.status === 'waiting') || [];
  const inProgress = queue?.filter(q => q.status === 'called' || q.status === 'in_progress') || [];
  const completed = queue?.filter(q => q.status === 'completed') || [];
  
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="h-6 bg-muted animate-pulse rounded mb-4" />
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="h-32 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const columns = [
    {
      title: 'Aguardando',
      items: waiting,
      color: 'bg-yellow-500',
      emptyText: 'Nenhum cliente aguardando',
    },
    {
      title: 'Em Atendimento',
      items: inProgress,
      color: 'bg-blue-500',
      emptyText: 'Nenhum atendimento em andamento',
    },
    {
      title: 'Finalizados Hoje',
      items: completed.slice(0, 10),
      color: 'bg-green-500',
      emptyText: 'Nenhum atendimento finalizado',
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {columns.map((column) => (
        <div 
          key={column.title}
          className="bg-card/50 border border-border rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-bold">{column.title}</h3>
            <span className="text-muted-foreground text-sm">
              ({column.items.length})
            </span>
          </div>
          
          <div className="p-4 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
            {column.items.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                {column.emptyText}
              </p>
            ) : (
              column.items.map((item) => (
                <QueueCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
