import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scissors, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJoinQueue, useServices, usePublicBarbers, useQueueSettings } from '@/hooks/useQueue';
import { requestNotificationPermission } from '@/lib/notifications';

const formSchema = z.object({
  customer_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  customer_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20),
  service_id: z.string().optional(),
  barber_id: z.string().optional(),
  priority: z.enum(['normal', 'preferencial']).default('normal'),
});

type FormData = z.infer<typeof formSchema>;

interface QueueJoinFormProps {
  onSuccess: () => void;
}

export const QueueJoinForm = ({ onSuccess }: QueueJoinFormProps) => {
  const [showPreferencial, setShowPreferencial] = useState(false);
  const { data: services } = useServices();
  const { data: barbers } = usePublicBarbers();
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
    try {
      // Request notification permission (non-blocking)
      requestNotificationPermission().catch(() => {
        // Silently ignore permission errors
      });
      
      await joinQueue.mutateAsync({
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.replace(/\D/g, ''),
        service_id: data.service_id || undefined,
        barber_id: data.barber_id || undefined,
        priority: data.priority,
      });
      
      onSuccess();
    } catch (error) {
      // Error is already handled by the mutation's onError
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
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  const isWithinHours = settings 
    ? currentTime >= settings.opening_time && currentTime < settings.closing_time
    : true;
  
  const isQueueOpen = (settings?.is_active ?? true) && isWithinHours;
  
  if (!isQueueOpen) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-red-500 mb-2">Fila Fechada</h3>
        <p className="text-muted-foreground mb-4">
          A fila abre às {settings?.opening_time || '09:00'} e fecha às {settings?.closing_time || '19:00'}.
        </p>
        <p className="text-sm text-muted-foreground">
          Horário atual: {currentTime}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="font-display text-2xl uppercase mb-6 text-center">Entrar na Fila</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Nome completo *</Label>
          <Input
            id="customer_name"
            placeholder="Seu nome"
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
        
        <div className="space-y-2">
          <Label>Serviço desejado</Label>
          <Select onValueChange={(value) => setValue('service_id', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecione um serviço (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {services?.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} - R$ {service.price.toFixed(2).replace('.', ',')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Barbeiro preferido</Label>
          <Select onValueChange={(value) => setValue('barber_id', value === 'any' ? undefined : value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Qualquer barbeiro disponível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer barbeiro disponível</SelectItem>
              {barbers?.filter(b => b.is_available).map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPreferencial(!showPreferencial)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPreferencial ? '▼' : '▶'} Atendimento preferencial?
          </button>
          
          {showPreferencial && (
            <div className="p-4 bg-background/50 rounded-lg">
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
            </div>
          )}
        </div>
        
        <Button
          type="submit"
          size="lg"
          disabled={joinQueue.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {joinQueue.isPending ? (
            <Loader2 className="animate-spin mr-2" size={20} />
          ) : (
            <Scissors className="mr-2" size={20} />
          )}
          Entrar na Fila
        </Button>
      </form>
    </div>
  );
};
