import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Loader2, SendHorizonal, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateQueueRequest, useMyQueueRequests } from '@/hooks/useQueueRequests';
import { useBarberDirectEntry } from '@/hooks/useBarberDirectEntry';
import { useServices } from '@/hooks/useQueue';
import { useAdminBarbers } from '@/hooks/useAdminBarbers';
import { MultiServiceSelector } from '@/components/queue/MultiServiceSelector';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const formSchema = z.object({
  customer_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  customer_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  barber_id: z.string().optional(),
  priority: z.enum(['normal', 'preferencial']).default('normal'),
});

type FormData = z.infer<typeof formSchema>;

interface BarberQueueEntryFormProps {
  barberId: string;
  canAddDirectly: boolean;
}

export const BarberQueueEntryForm = ({ barberId, canAddDirectly }: BarberQueueEntryFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const { data: services } = useServices();
  const { data: barbers } = useAdminBarbers();
  const { data: myRequests } = useMyQueueRequests();
  const createRequest = useCreateQueueRequest();
  const directEntry = useBarberDirectEntry();

  const pendingRequests = myRequests?.filter(r => r.status === 'pending') || [];
  const recentRequests = myRequests?.slice(0, 5) || [];

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
    if (canAddDirectly) {
      // Direct entry - add directly to queue with multi-service support
      await directEntry.mutateAsync({
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.replace(/\D/g, ''),
        service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        barber_id: data.barber_id || barberId, // Default to this barber
        priority: data.priority,
      });
    } else {
      // Request entry - needs admin approval (single service for now)
      await createRequest.mutateAsync({
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.replace(/\D/g, ''),
        service_id: selectedServiceIds[0] || undefined, // First service for requests
        barber_id: data.barber_id || undefined,
        priority: data.priority,
        requested_by: barberId,
      });
    }
    reset();
    setSelectedServiceIds([]);
    setIsOpen(false);
  };

  const isPending = createRequest.isPending || directEntry.isPending;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="text-yellow-500" />;
      case 'approved':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Aguardando aprovação';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Direct Entry Badge */}
      {canAddDirectly && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30"
        >
          <Zap size={16} />
          <span className="font-medium">Entrada Direta Liberada</span>
          <span className="text-muted-foreground">- Você pode adicionar clientes sem aprovação</span>
        </motion.div>
      )}

      {/* Pending Requests Alert (only for non-direct entry) */}
      {!canAddDirectly && pendingRequests.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-yellow-500">
              <Clock size={18} className="animate-pulse" />
              <span className="font-medium">
                {pendingRequests.length} solicitação(ões) aguardando aprovação
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Request Button/Form */}
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full",
            canAddDirectly 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          <UserPlus className="mr-2" size={16} />
          {canAddDirectly ? 'Adicionar Cliente na Fila' : 'Solicitar Entrada de Cliente'}
        </Button>
      ) : (
        <Card className={cn(
          "border-border",
          canAddDirectly && "border-green-500/30"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {canAddDirectly ? (
                <>
                  <Zap size={18} className="text-green-500" />
                  Adicionar Cliente Diretamente
                </>
              ) : (
                <>
                  <SendHorizonal size={18} className="text-primary" />
                  Solicitar Entrada na Fila
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Serviços</Label>
                {services && services.length > 0 && (
                  <MultiServiceSelector
                    services={services}
                    selectedIds={selectedServiceIds}
                    onChange={setSelectedServiceIds}
                    compact
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Barbeiro Preferido</Label>
                <Select 
                  onValueChange={(value) => setValue('barber_id', value)}
                  defaultValue={barberId}
                >
                  <SelectTrigger className="bg-background h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Você" />
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
                          {barber.id === barberId && ' (Você)'}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onClick={() => { reset(); setSelectedServiceIds([]); setIsOpen(false); }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className={cn(
                    "flex-1",
                    canAddDirectly 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin mr-1" size={14} />
                  ) : canAddDirectly ? (
                    <Zap className="mr-1" size={14} />
                  ) : (
                    <SendHorizonal className="mr-1" size={14} />
                  )}
                  {canAddDirectly ? 'Adicionar' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests History (only for non-direct entry) */}
      {!canAddDirectly && recentRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Minhas Solicitações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRequests.map((request) => (
                <div 
                  key={request.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border text-sm',
                    request.status === 'pending' && 'bg-yellow-500/5 border-yellow-500/30',
                    request.status === 'approved' && 'bg-green-500/5 border-green-500/30',
                    request.status === 'rejected' && 'bg-red-500/5 border-red-500/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="font-medium">{request.customer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getStatusLabel(request.status)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};