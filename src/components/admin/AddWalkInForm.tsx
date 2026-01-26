import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddWalkIn } from '@/hooks/useAdminQueue';
import { useServices } from '@/hooks/useQueue';
import { useAvailableBarbers } from '@/hooks/useAdminBarbers';

const formSchema = z.object({
  customer_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  customer_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  service_id: z.string().optional(),
  barber_id: z.string().optional(),
  priority: z.enum(['normal', 'preferencial']).default('normal'),
});

type FormData = z.infer<typeof formSchema>;

export const AddWalkInForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: services } = useServices();
  const { data: barbers, isLoading: barbersLoading } = useAvailableBarbers();
  const addWalkIn = useAddWalkIn();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: 'normal',
    },
  });

  const onSubmit = async (data: FormData) => {
    await addWalkIn.mutateAsync({
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone.replace(/\D/g, ''),
      service_id: data.service_id || undefined,
      barber_id: data.barber_id || undefined,
      priority: data.priority,
    });
    reset();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
        size="sm"
      >
        <UserPlus className="mr-2" size={16} />
        <span className="hidden sm:inline">Adicionar Cliente Presencial</span>
        <span className="sm:hidden">Add Cliente</span>
      </Button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 w-full">
      <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
        <UserPlus size={16} />
        Cliente Presencial
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="customer_name" className="text-xs sm:text-sm">Nome *</Label>
            <Input
              id="customer_name"
              placeholder="Nome do cliente"
              {...register('customer_name')}
              className="bg-background h-9 sm:h-10 text-sm"
            />
            {errors.customer_name && (
              <p className="text-xs text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="customer_phone" className="text-xs sm:text-sm">Telefone *</Label>
            <Input
              id="customer_phone"
              placeholder="(82) 99999-9999"
              {...register('customer_phone')}
              className="bg-background h-9 sm:h-10 text-sm"
            />
            {errors.customer_phone && (
              <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Serviço</Label>
            <Select onValueChange={(value) => setValue('service_id', value)}>
              <SelectTrigger className="bg-background h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Barbeiro</Label>
            <Select onValueChange={(value) => setValue('barber_id', value)}>
              <SelectTrigger className="bg-background h-9 sm:h-10 text-sm">
                <SelectValue placeholder={barbersLoading ? "Carregando..." : "Qualquer"} />
              </SelectTrigger>
              <SelectContent>
                {barbers?.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        barber.status === 'online' ? 'bg-green-500' : 
                        barber.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                      }`} />
                      {barber.display_name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="preferencial"
            onChange={(e) => setValue('priority', e.target.checked ? 'preferencial' : 'normal')}
            className="rounded w-4 h-4"
          />
          <Label htmlFor="preferencial" className="text-xs sm:text-sm cursor-pointer">
            Atendimento preferencial
          </Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { reset(); setIsOpen(false); }}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={addWalkIn.isPending}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {addWalkIn.isPending ? (
              <Loader2 className="animate-spin mr-1" size={14} />
            ) : (
              <UserPlus className="mr-1" size={14} />
            )}
            Adicionar
          </Button>
        </div>
      </form>
    </div>
  );
};
