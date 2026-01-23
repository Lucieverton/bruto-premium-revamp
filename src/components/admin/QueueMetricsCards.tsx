import { Users, Clock, CheckCircle, Timer } from 'lucide-react';
import { useTodayQueue } from '@/hooks/useQueue';

export const QueueMetricsCards = () => {
  const { data: queue } = useTodayQueue();
  
  const waiting = queue?.filter(q => q.status === 'waiting').length || 0;
  const inProgress = queue?.filter(q => q.status === 'in_progress' || q.status === 'called').length || 0;
  const completed = queue?.filter(q => q.status === 'completed').length || 0;
  
  // Calculate average wait time for completed tickets
  const completedItems = queue?.filter(q => q.status === 'completed' && q.called_at) || [];
  let avgWaitTime = 0;
  if (completedItems.length > 0) {
    const totalWait = completedItems.reduce((sum, item) => {
      const created = new Date(item.created_at).getTime();
      const called = new Date(item.called_at!).getTime();
      return sum + (called - created) / 1000 / 60;
    }, 0);
    avgWaitTime = Math.round(totalWait / completedItems.length);
  }

  const metrics = [
    { 
      icon: Users, 
      label: 'Na Fila', 
      value: waiting, 
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10' 
    },
    { 
      icon: Clock, 
      label: 'Atendendo', 
      value: inProgress, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10' 
    },
    { 
      icon: CheckCircle, 
      label: 'Finalizados', 
      value: completed, 
      color: 'text-green-500',
      bg: 'bg-green-500/10' 
    },
    { 
      icon: Timer, 
      label: 'Tempo Médio', 
      value: `${avgWaitTime} min`, 
      color: 'text-primary',
      bg: 'bg-primary/10' 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div 
          key={metric.label}
          className={`${metric.bg} rounded-lg p-4 border border-border`}
        >
          <div className="flex items-center gap-3 mb-2">
            <metric.icon className={metric.color} size={20} />
            <span className="text-sm text-muted-foreground">{metric.label}</span>
          </div>
          <div className={`text-3xl font-bold ${metric.color}`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
};
