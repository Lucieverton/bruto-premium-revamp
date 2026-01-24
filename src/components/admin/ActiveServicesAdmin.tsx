import { Play, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodayQueue, useBarbers, useServices } from '@/hooks/useQueue';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const ActiveServicesAdmin = () => {
  const { data: queue } = useTodayQueue();
  const { data: barbers } = useBarbers();
  const { data: services } = useServices();
  
  // Get active services (called + in_progress)
  const activeServices = queue?.filter(q => 
    q.status === 'called' || q.status === 'in_progress'
  ) || [];
  
  if (activeServices.length === 0) {
    return null;
  }
  
  const getBarber = (barberId: string | null) => {
    if (!barberId) return null;
    return barbers?.find(b => b.id === barberId);
  };
  
  const getService = (serviceId: string | null) => {
    if (!serviceId) return null;
    return services?.find(s => s.id === serviceId);
  };

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-blue-500 text-lg">
          <Play size={18} />
          Atendimentos Ativos ({activeServices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {activeServices.map((item) => {
              const barber = getBarber(item.barber_id);
              const service = getService(item.service_id);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    'bg-card border rounded-lg p-3 flex items-center gap-3',
                    item.status === 'called' 
                      ? 'border-green-500 animate-pulse' 
                      : 'border-blue-500/50'
                  )}
                >
                  {/* Barber Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                    item.status === 'called' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-blue-500/20 text-blue-500'
                  )}>
                    {barber?.display_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-bold text-sm',
                        item.status === 'called' ? 'text-green-500' : 'text-blue-500'
                      )}>
                        {item.ticket_number}
                      </span>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        item.status === 'called' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      )}>
                        {item.status === 'called' ? 'Chamando' : 'Atendendo'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <User size={10} />
                      {item.customer_name}
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {barber && <span className="text-primary truncate">{barber.display_name}</span>}
                      {service && <span className="truncate">• {service.name}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
