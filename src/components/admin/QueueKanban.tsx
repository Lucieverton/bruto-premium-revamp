import { useTodayQueue, useBarbers } from '@/hooks/useQueue';
import { QueueCard } from './QueueCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Play, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type ColumnType = 'waiting' | 'called' | 'inProgress' | 'completed';

export const QueueKanban = () => {
  const { data: queue, isLoading } = useTodayQueue();
  const { data: barbers } = useBarbers();
  const [activeTab, setActiveTab] = useState<ColumnType>('waiting');
  
  const waiting = queue?.filter(q => q.status === 'waiting') || [];
  const called = queue?.filter(q => q.status === 'called') || [];
  const inProgress = queue?.filter(q => q.status === 'in_progress') || [];
  const completed = queue?.filter(q => q.status === 'completed') || [];
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="h-5 sm:h-6 bg-muted animate-pulse rounded mb-3 sm:mb-4" />
            <div className="space-y-2 sm:space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="h-24 sm:h-32 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const columns = [
    {
      key: 'waiting' as ColumnType,
      title: 'Aguardando',
      items: waiting,
      color: 'bg-yellow-500',
      icon: Clock,
      emptyText: 'Nenhum aguardando',
      highlight: false,
    },
    {
      key: 'called' as ColumnType,
      title: 'Chamando',
      items: called,
      color: 'bg-green-500',
      icon: Phone,
      emptyText: 'Nenhum chamado',
      highlight: true,
    },
    {
      key: 'inProgress' as ColumnType,
      title: 'Atendendo',
      items: inProgress,
      color: 'bg-blue-500',
      icon: Play,
      emptyText: 'Nenhum atendimento',
      highlight: false,
    },
    {
      key: 'completed' as ColumnType,
      title: 'Finalizados',
      items: completed.slice(0, 8),
      color: 'bg-primary',
      icon: CheckCircle,
      emptyText: 'Nenhum finalizado',
      highlight: false,
    },
  ];

  const activeColumn = columns.find(c => c.key === activeTab);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Called clients banner - prominent display */}
      <AnimatePresence>
        {called.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 border-2 border-green-500 rounded-xl p-3 sm:p-6"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Phone className="w-5 h-5 sm:w-8 sm:h-8 text-green-500" />
              </motion.div>
              <h2 className="text-lg sm:text-2xl font-bold text-green-500">CHAMANDO</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {called.map((item) => {
                const barber = barbers?.find(b => b.id === item.barber_id);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 15px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0.4)']
                    }}
                    transition={{ 
                      duration: 0.3,
                      boxShadow: { duration: 1.5, repeat: Infinity }
                    }}
                    className="bg-card border-2 border-green-500 rounded-lg p-3 sm:p-4 text-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-2xl sm:text-4xl font-bold text-green-500 mb-1 sm:mb-2"
                    >
                      {item.ticket_number}
                    </motion.div>
                    <div className="text-sm sm:text-lg font-medium truncate">{item.customer_name}</div>
                    {barber && (
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                        <span className="text-primary">{barber.display_name}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Tabs */}
      <div className="flex md:hidden overflow-x-auto gap-1 bg-card border border-border rounded-lg p-1">
        {columns.map((column) => (
          <button
            key={column.key}
            onClick={() => setActiveTab(column.key)}
            className={cn(
              'flex-1 min-w-[70px] px-2 py-2 rounded-md text-xs font-medium transition-colors flex flex-col items-center gap-1',
              activeTab === column.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <column.icon size={14} />
            <span>{column.title}</span>
            <span className={cn(
              'text-[10px] px-1.5 rounded-full',
              activeTab === column.key ? 'bg-primary-foreground/20' : 'bg-muted'
            )}>
              {column.items.length}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile Single Column View */}
      <div className="md:hidden">
        {activeColumn && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {activeColumn.items.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {activeColumn.emptyText}
                </p>
              ) : (
                activeColumn.items.map((item) => (
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
        )}
      </div>

      {/* Desktop Kanban columns */}
      <div className="hidden md:grid md:grid-cols-4 gap-3 lg:gap-4">
        {columns.map((column) => (
          <div 
            key={column.title}
            className={cn(
              'bg-card/50 border rounded-lg overflow-hidden transition-all duration-300',
              column.highlight && column.items.length > 0 
                ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                : 'border-border'
            )}
          >
            <div className="p-3 lg:p-4 border-b border-border flex items-center gap-2">
              <div className={cn(
                'w-2.5 h-2.5 rounded-full',
                column.color,
                column.highlight && column.items.length > 0 ? 'animate-pulse' : ''
              )} />
              <column.icon size={14} className="text-muted-foreground" />
              <h3 className="font-bold text-xs lg:text-sm">{column.title}</h3>
              <span className="text-muted-foreground text-xs ml-auto">
                {column.items.length}
              </span>
            </div>
            
            <div className="p-2 lg:p-3 space-y-2 lg:space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {column.items.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-4 lg:py-6">
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
