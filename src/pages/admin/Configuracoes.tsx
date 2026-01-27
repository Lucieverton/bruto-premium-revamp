import { useState, useEffect } from 'react';
import { Clock, Users, Save, Loader2, Settings } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQueueSettings } from '@/hooks/useQueue';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeleteAttendanceDialog } from '@/components/admin/DeleteAttendanceDialog';

const AdminConfiguracoes = () => {
  const { data: settings, isLoading } = useQueueSettings();
  const [formData, setFormData] = useState({
    opening_time: '09:00',
    closing_time: '19:00',
    max_queue_size: 50,
    is_active: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setFormData({
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        max_queue_size: settings.max_queue_size,
        is_active: settings.is_active,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!settings?.id) throw new Error('Settings not found');
      
      const { error } = await supabase
        .from('queue_settings')
        .update({
          opening_time: data.opening_time,
          closing_time: data.closing_time,
          max_queue_size: data.max_queue_size,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-settings'] });
      toast({ title: 'Configurações salvas com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl uppercase">Configurações</h1>
          <p className="text-muted-foreground">Configure o funcionamento da fila virtual</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Define quando a fila virtual aceita novos clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening">Abertura</Label>
                  <Input
                    id="opening"
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing">Fechamento</Label>
                  <Input
                    id="closing"
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Capacidade da Fila
              </CardTitle>
              <CardDescription>
                Número máximo de pessoas que podem entrar na fila por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="max_size">Tamanho Máximo</Label>
                <Input
                  id="max_size"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.max_queue_size}
                  onChange={(e) => setFormData({ ...formData, max_queue_size: parseInt(e.target.value) || 50 })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status da Fila</CardTitle>
              <CardDescription>
                Controle se a fila está aceitando novos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Fila Virtual</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Aceitando novos clientes' : 'Fila fechada'}
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Save className="mr-2" size={20} />
            )}
            Salvar Configurações
          </Button>
        </form>

        {/* Separator */}
        <Separator className="my-6" />

        {/* Danger Zone */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings size={16} />
            <span className="text-sm font-medium uppercase tracking-wide">Zona de Perigo</span>
          </div>
          
          <DeleteAttendanceDialog />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConfiguracoes;
