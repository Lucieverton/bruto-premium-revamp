import { useState } from 'react';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MeuPerfil = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: barber, isLoading } = useQuery({
    queryKey: ['my-barber-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const toggleAvailability = useMutation({
    mutationFn: async (is_available: boolean) => {
      if (!barber?.id) throw new Error('Barbeiro não encontrado');
      
      const { error } = await supabase
        .from('barbers')
        .update({ is_available })
        .eq('id', barber.id);
      
      if (error) throw error;
    },
    onSuccess: (_, is_available) => {
      queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
      toast({ 
        title: is_available ? 'Agora você está disponível!' : 'Você está indisponível',
        description: is_available 
          ? 'Clientes podem ser atribuídos a você na fila.' 
          : 'Você não receberá novos atendimentos.',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  if (!barber) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Perfil de barbeiro não encontrado. Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="font-display text-2xl uppercase mb-6">Meu Perfil</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{barber.display_name}</CardTitle>
            {barber.specialty && (
              <p className="text-muted-foreground">{barber.specialty}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {barber.is_available ? (
                  <UserCheck size={24} className="text-green-500" />
                ) : (
                  <UserX size={24} className="text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {barber.is_available ? 'Disponível para atendimento' : 'Indisponível'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {barber.is_available 
                      ? 'Você pode receber novos clientes na fila' 
                      : 'Você não receberá novos clientes'}
                  </p>
                </div>
              </div>
              <Switch
                checked={barber.is_available}
                onCheckedChange={(checked) => toggleAvailability.mutate(checked)}
                disabled={toggleAvailability.isPending}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Email: {user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default MeuPerfil;
