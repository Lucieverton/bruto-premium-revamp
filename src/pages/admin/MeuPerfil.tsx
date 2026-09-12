import { Loader2, UserCheck, UserX, Sparkles, Settings, DollarSign, Bell, BellRing, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
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
import { WhatsAppNumberForm } from '@/components/profile/WhatsAppNumberForm';
import { BarberAvailabilityControl } from '@/components/barber/BarberAvailabilityControl';


import { requestPushPermission, sendTestNotification } from '@/lib/pwa';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { sendTestPush } from '@/lib/pushNotify';
import { motion } from 'framer-motion';

const MeuPerfil = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

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

  // Disponibilidade/pausas são controladas em BarberAvailabilityControl (RPC barber_set_availability)



  const handleAvatarUpdate = (newUrl: string) => {
    queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
    queryClient.invalidateQueries({ queryKey: ['barbers'] });
    queryClient.invalidateQueries({ queryKey: ['public-barbers'] });
  };

  // Queue alerts now handled globally in AdminLayout

  // Request notification permission + register this device for background alerts
  const requestNotifications = async () => {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      setNotificationStatus('denied');
      toast({
        title: '⚠️ Notificações bloqueadas',
        description: 'Habilite as notificações nas configurações do navegador.',
        variant: 'destructive',
      });
      return;
    }

    setNotificationStatus('granted');
    const result = await registerPush(true);

    if (result.state === 'registered') {
      toast({
        title: '🔔 Notificações ativadas!',
        description: 'Este celular receberá o aviso mesmo com a tela bloqueada.',
      });
    } else {
      toast({
        title: '⚠️ Não foi possível registrar este celular',
        description: result.detail || 'Tente novamente em alguns segundos.',
        variant: 'destructive',
      });
    }
  };

  // Local test (only shows a notification on this device)
  const handleTestNotification = async () => {
    const sent = await sendTestNotification();
    if (sent) {
      toast({
        title: '✅ Notificação enviada!',
        description: 'Verifique a barra de notificações do seu celular.',
      });
    } else {
      toast({
        title: '❌ Falha ao enviar',
        description: 'Verifique se as notificações estão permitidas nas configurações do navegador.',
        variant: 'destructive',
      });
    }
  };

  // Real test: server → device (works with the screen locked / app closed)
  const handleRealTestPush = async () => {
    if (!barber?.id) return;
    setTestingPush(true);
    try {
      let current = pushStatus;
      if (current.state !== 'registered') {
        current = await registerPush(true);
      }
      if (current.state !== 'registered') {
        toast({
          title: '⚠️ Celular não registrado',
          description: current.detail || 'Ative as notificações neste aparelho primeiro.',
          variant: 'destructive',
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const result = await sendTestPush(barber.id, session?.access_token ?? '');

      if (result.ok) {
        toast({
          title: '📲 Teste enviado!',
          description: 'Bloqueie a tela do celular: a notificação deve aparecer em alguns segundos.',
        });
      } else {
        toast({
          title: '❌ O envio não chegou ao celular',
          description: result.detail?.slice(0, 160) || 'Nenhum aparelho registrado.',
          variant: 'destructive',
        });
      }
    } finally {
      setTestingPush(false);
    }
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
            {/* Controle de disponibilidade e pausas */}
            <BarberAvailabilityControl barber={barber} />


            {/* Notification Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <BellRing size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Alertas de Novos Clientes</p>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações quando clientes entrarem na sua fila
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {notificationStatus === 'granted' || (typeof Notification !== 'undefined' && Notification.permission === 'granted') ? (
                    <div className="flex items-center gap-1 text-sm text-green-500">
                      <CheckCircle2 size={16} />
                      <span>Ativo</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestNotifications}
                      className="border-primary/30 hover:bg-primary/10"
                    >
                      <Bell size={16} className="mr-2" />
                      Ativar
                    </Button>
                  )}
                </div>
              </div>

              {/* Test notification button */}
              {(notificationStatus === 'granted' || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  className="w-full border-primary/20 hover:bg-primary/10"
                >
                  <Bell size={16} className="mr-2" />
                  Enviar Notificação de Teste
                </Button>
              )}
            </motion.div>

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

        {/* WhatsApp Number Form */}
        <WhatsAppNumberForm 
          barberId={barber.id} 
          currentNumber={barber.whatsapp_number as string | null} 
        />

      </div>
    </AdminLayout>
  );
};

export default MeuPerfil;
