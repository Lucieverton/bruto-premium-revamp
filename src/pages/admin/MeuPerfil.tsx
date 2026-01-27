import { Loader2, UserCheck, UserX, Sparkles, Settings, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

const MeuPerfil = () => {
  const { user, isAdmin } = useAuth();
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
      
      // Update both is_available AND status field for real-time sync
      const { error } = await supabase
        .from('barbers')
        .update({ 
          is_available,
          status: is_available ? 'online' : 'offline'
        })
        .eq('id', barber.id);
      
      if (error) throw error;
    },
    onSuccess: (_, is_available) => {
      // Force immediate refetch for real-time sync
      queryClient.refetchQueries({ queryKey: ['my-barber-profile'] });
      queryClient.refetchQueries({ queryKey: ['barbers'] });
      queryClient.refetchQueries({ queryKey: ['public-barbers'] });
      queryClient.refetchQueries({ queryKey: ['admin-barbers'] });
      toast({ 
        title: is_available ? 'Agora você está online!' : 'Você está offline',
        description: is_available 
          ? 'Clientes podem ver você disponível na fila.' 
          : 'Você aparecerá como offline na fila.',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const handleAvatarUpdate = (newUrl: string) => {
    queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
    queryClient.invalidateQueries({ queryKey: ['barbers'] });
    queryClient.invalidateQueries({ queryKey: ['public-barbers'] });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  if (!barber) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6">
          <Card className="bg-gradient-to-br from-card to-muted/20">
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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl uppercase">Meu Perfil</h1>
              <p className="text-sm text-muted-foreground">Gerencie sua disponibilidade e acompanhe seus ganhos</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/meu-financeiro">
                  <DollarSign size={16} className="mr-2" />
                  Financeiro
                </Link>
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/configuracoes">
                  <Settings size={16} className="mr-2" />
                  Configurações
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/20 border-border">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl flex items-center gap-4">
              <AvatarUpload
                barberId={barber.id}
                avatarUrl={barber.avatar_url}
                displayName={barber.display_name}
                onUploadSuccess={handleAvatarUpdate}
                size="lg"
              />
              <div>
                {barber.display_name}
                {barber.specialty && (
                  <p className="text-sm font-normal text-muted-foreground mt-0.5">{barber.specialty}</p>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 relative z-10">
            {/* Availability Toggle */}
            {(() => {
              const isInService = barber.status === 'busy';
              return (
                <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isInService
                    ? 'bg-destructive/10 border-destructive/30'
                    : barber.is_available 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-muted/50 border-border'
                }`}>
                  <div className="flex items-center gap-3">
                    {isInService ? (
                      <div className="p-2 bg-destructive/20 rounded-lg">
                        <Loader2 size={20} className="text-destructive animate-spin" />
                      </div>
                    ) : barber.is_available ? (
                      <div className="p-2 bg-success/20 rounded-lg">
                        <UserCheck size={20} className="text-success" />
                      </div>
                    ) : (
                      <div className="p-2 bg-muted rounded-lg">
                        <UserX size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {isInService 
                          ? 'Em atendimento' 
                          : barber.is_available 
                            ? 'Disponível para atendimento' 
                            : 'Indisponível'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isInService
                          ? 'Finalize o atendimento atual para alterar'
                          : barber.is_available 
                            ? 'Você pode receber novos clientes na fila' 
                            : 'Você não receberá novos clientes'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={barber.is_available}
                    onCheckedChange={(checked) => toggleAvailability.mutate(checked)}
                    disabled={toggleAvailability.isPending || isInService}
                  />
                </div>
              );
            })()}

            {/* User Info */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Comissão</span>
              <span className="text-sm font-bold text-primary">{barber.commission_percentage}%</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
};

export default MeuPerfil;
