import { useTodayQueue, useBarbers } from '@/hooks/useQueue';
import { QueueCard } from './QueueCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Play, CheckCircle, Clock } from 'lucide-react';

export const QueueKanban = () => {
  const { data: queue, isLoading } = useTodayQueue();
  const { data: barbers } = useBarbers();
  
  const waiting = queue?.filter(q => q.status === 'waiting') || [];
  const called = queue?.filter(q => q.status === 'called') || [];
  const inProgress = queue?.filter(q => q.status === 'in_progress') || [];
  const completed = queue?.filter(q => q.status === 'completed') || [];
  
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
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
      icon: Clock,
      emptyText: 'Nenhum cliente aguardando',
      highlight: false,
    },
    {
      title: 'Chamando',
      items: called,
      color: 'bg-green-500',
      icon: Phone,
      emptyText: 'Nenhum cliente chamado',
      highlight: true,
    },
    {
      title: 'Atendendo',
      items: inProgress,
      color: 'bg-blue-500',
      icon: Play,
      emptyText: 'Nenhum atendimento',
      highlight: false,
    },
    {
      title: 'Finalizados',
      items: completed.slice(0, 8),
      color: 'bg-primary',
      icon: CheckCircle,
      emptyText: 'Nenhum finalizado',
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Called clients banner - prominent display */}
      <AnimatePresence>
        {called.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 border-2 border-green-500 rounded-xl p-6"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Phone className="w-8 h-8 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-green-500">CHAMANDO CLIENTES</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {called.map((item) => {
                const barber = barbers?.find(b => b.id === item.barber_id);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 20px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0.4)']
                    }}
                    transition={{ 
                      duration: 0.3,
                      boxShadow: { duration: 1.5, repeat: Infinity }
                    }}
                    className="bg-card border-2 border-green-500 rounded-lg p-4 text-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-4xl font-bold text-green-500 mb-2"
                    >
                      {item.ticket_number}
                    </motion.div>
                    <div className="text-lg font-medium">{item.customer_name}</div>
                    {barber && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Barbeiro: <span className="text-primary">{barber.display_name}</span>
                      </div>
                    )}
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="mt-3 text-sm text-green-400 font-medium"
                    >
                      ⏳ Aguardando comparecimento...
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Kanban columns */}
      <div className="grid md:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div 
            key={column.title}
            className={`bg-card/50 border rounded-lg overflow-hidden transition-all duration-300 ${
              column.highlight && column.items.length > 0 
                ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                : 'border-border'
            }`}
          >
            <div className="p-4 border-b border-border flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color} ${
                column.highlight && column.items.length > 0 ? 'animate-pulse' : ''
              }`} />
              <column.icon size={16} className="text-muted-foreground" />
              <h3 className="font-bold text-sm">{column.title}</h3>
              <span className="text-muted-foreground text-sm ml-auto">
                {column.items.length}
              </span>
            </div>
            
            <div className="p-3 space-y-3 max-h-[calc(100vh-500px)] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {column.items.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-6">
                    {column.emptyText}
                  </p>
                ) : (
                  column.items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <QueueCard item={item} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
