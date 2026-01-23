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
import { useServices, useBarbers } from '@/hooks/useQueue';

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
  const { data: barbers } = useBarbers();
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
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <UserPlus className="mr-2" size={18} />
        Adicionar Cliente Presencial
      </Button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <UserPlus size={18} />
        Cliente Presencial (Walk-in)
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="customer_name" className="text-sm">Nome *</Label>
            <Input
              id="customer_name"
              placeholder="Nome do cliente"
              {...register('customer_name')}
              className="bg-background"
            />
            {errors.customer_name && (
              <p className="text-xs text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="customer_phone" className="text-sm">Telefone *</Label>
            <Input
              id="customer_phone"
              placeholder="(82) 99999-9999"
              {...register('customer_phone')}
              className="bg-background"
            />
            {errors.customer_phone && (
              <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Serviço</Label>
            <Select onValueChange={(value) => setValue('service_id', value)}>
              <SelectTrigger className="bg-background">
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
            <Label className="text-sm">Barbeiro</Label>
            <Select onValueChange={(value) => setValue('barber_id', value)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                {barbers?.filter(b => b.is_available).map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.display_name}
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
            className="rounded"
          />
          <Label htmlFor="preferencial" className="text-sm cursor-pointer">
            Atendimento preferencial
          </Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { reset(); setIsOpen(false); }}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={addWalkIn.isPending}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {addWalkIn.isPending ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <UserPlus className="mr-2" size={16} />
            )}
            Adicionar
          </Button>
        </div>
      </form>
    </div>
  );
};
