import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scissors, Loader2, CheckCircle2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useJoinQueue, useServices, useQueueSettings, Service } from '@/hooks/useQueue';
import { requestNotificationPermission } from '@/lib/notifications';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  customer_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  customer_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20),
  priority: z.enum(['normal', 'preferencial']).default('normal'),
});

type FormData = z.infer<typeof formSchema>;

interface BarberQueueFormProps {
  barberId: string;
  barberName: string;
  onSuccess: () => void;
}

export const BarberQueueForm = ({ barberId, barberName, onSuccess }: BarberQueueFormProps) => {
  const [showPreferencial, setShowPreferencial] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const { data: services } = useServices();
  const { data: settings } = useQueueSettings();
  const joinQueue = useJoinQueue();
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: 'normal',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    if (selectedServices.length === 0) {
      return;
    }
    
    try {
      // Request notification permission (non-blocking)
      requestNotificationPermission().catch(() => {});
      
      await joinQueue.mutateAsync({
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.replace(/\D/g, ''),
        service_ids: selectedServices.map(s => s.id),
        barber_id: barberId,
        priority: data.priority,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Queue join error:', error);
    }
  };
  
  // Format phone number
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };
  
  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };
  
  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };
  
  // Calculate total
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  
  const isQueueOpen = settings?.is_active ?? true;
  
  if (!isQueueOpen) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-destructive mb-2">Fila Fechada</h3>
        <p className="text-muted-foreground mb-4">A fila está temporariamente fechada.</p>
        <p className="text-sm text-muted-foreground">
          Horário: {settings?.opening_time || '09:00'} - {settings?.closing_time || '19:00'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-primary/10 border border-primary/30 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Serviços selecionados:</span>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedServices.map(service => (
              <Badge
                key={service.id}
                variant="outline"
                className="flex items-center gap-1 pr-1 bg-background"
              >
                {service.name}
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="ml-1 hover:bg-destructive/20 rounded p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex justify-between text-sm border-t border-primary/20 pt-2">
            <span className="text-muted-foreground">
              ⏱️ ~{totalDuration} min
            </span>
            <span className="font-bold text-primary">
              Total: R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </motion.div>
      )}

      {/* Service Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Escolha o(s) serviço(s) *
          </Label>
          <span className="text-xs text-muted-foreground">
            Selecione múltiplos
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
          <AnimatePresence>
            {services?.map((service, index) => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              
              return (
                <motion.button
                  key={service.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleServiceToggle(service)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    'hover:border-primary/50 hover:bg-primary/5',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{service.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {service.duration_minutes} min
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-primary">
                        R$ {service.price.toFixed(2).replace('.', ',')}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        {selectedServices.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Toque para selecionar um ou mais serviços
          </p>
        )}
      </div>
      
      {/* Customer Info */}
      <div className="space-y-4 pt-2 border-t border-border/50">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Seu nome *</Label>
          <Input
            id="customer_name"
            placeholder="Digite seu nome completo"
            {...register('customer_name')}
            className="bg-background"
          />
          {errors.customer_name && (
            <p className="text-sm text-destructive">{errors.customer_name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer_phone">WhatsApp *</Label>
          <Input
            id="customer_phone"
            placeholder="(82) 99999-9999"
            {...register('customer_phone', {
              onChange: (e) => {
                e.target.value = formatPhone(e.target.value);
              }
            })}
            className="bg-background"
          />
          {errors.customer_phone && (
            <p className="text-sm text-destructive">{errors.customer_phone.message}</p>
          )}
        </div>
      </div>
      
      {/* Priority */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowPreferencial(!showPreferencial)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPreferencial ? '▼' : '▶'} Atendimento preferencial?
        </button>
        
        {showPreferencial && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-background/50 rounded-lg"
          >
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => setValue('priority', e.target.checked ? 'preferencial' : 'normal')}
                className="rounded border-border"
              />
              <span className="text-sm">
                Atendimento preferencial (idosos, gestantes, PcD)
              </span>
            </Label>
          </motion.div>
        )}
      </div>
      
      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={joinQueue.isPending || selectedServices.length === 0}
        className={cn(
          'w-full group relative overflow-hidden',
          'bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-400',
          'text-zinc-900 font-bold uppercase tracking-wide',
          'shadow-md hover:shadow-lg',
          'border border-white/50',
          'transition-all duration-300',
          'disabled:opacity-50'
        )}
      >
        {/* Shine effect */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        
        {joinQueue.isPending ? (
          <Loader2 className="animate-spin mr-2 relative z-10" size={20} />
        ) : (
          <Scissors className="mr-2 relative z-10" size={20} />
        )}
        <span className="relative z-10">
          {selectedServices.length > 1 
            ? `Entrar (${selectedServices.length} serviços)` 
            : `Entrar na Fila de ${barberName.split(' ')[0]}`
          }
        </span>
      </Button>
    </form>
  );
};
