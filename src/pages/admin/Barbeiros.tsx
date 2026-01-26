import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, UserCheck, UserX, Mail, Lock, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Barber {
  id: string;
  display_name: string;
  specialty: string | null;
  is_available: boolean;
  is_active: boolean;
  avatar_url: string | null;
  user_id: string | null;
  commission_percentage: number;
  status: 'online' | 'away' | 'offline';
  can_add_clients_directly: boolean;
}

const AdminBarbeiros = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deleteBarber, setDeleteBarber] = useState<Barber | null>(null);
  const [createMode, setCreateMode] = useState<'simple' | 'with-login'>('simple');
  const [formData, setFormData] = useState({
    display_name: '',
    specialty: '',
    email: '',
    password: '',
    commission_percentage: '50',
    can_add_clients_directly: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: barbers, isLoading } = useQuery({
    queryKey: ['admin-barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .order('display_name');
      if (error) throw error;
      return data as Barber[];
    },
  });

  const createSimpleMutation = useMutation({
    mutationFn: async (data: { display_name: string; specialty: string; commission_percentage: string }) => {
      const { error } = await supabase.from('barbers').insert({
        display_name: data.display_name,
        specialty: data.specialty || null,
        commission_percentage: parseFloat(data.commission_percentage) || 50,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-barbers'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Barbeiro adicionado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });

  const createWithLoginMutation = useMutation({
    mutationFn: async (data: { display_name: string; specialty: string; email: string; password: string; commission_percentage: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-barber-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            display_name: data.display_name,
            specialty: data.specialty || null,
            commission_percentage: parseFloat(data.commission_percentage) || 50,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar funcionário');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-barbers'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ 
        title: 'Funcionário criado com sucesso!',
        description: 'O barbeiro pode fazer login com o email e senha cadastrados.'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar funcionário', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Barber> }) => {
      const { error } = await supabase.from('barbers').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-barbers'] });
      setIsDialogOpen(false);
      setEditingBarber(null);
      resetForm();
      toast({ title: 'Barbeiro atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('barbers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-barbers'] });
      setDeleteBarber(null);
      toast({ title: 'Barbeiro removido!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      // Keep status consistent with the availability toggle
      const { error } = await supabase
        .from('barbers')
        .update({
          is_available,
          status: is_available ? 'online' : 'offline',
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Force immediate refetch for real-time sync
      queryClient.refetchQueries({ queryKey: ['admin-barbers'] });
      queryClient.refetchQueries({ queryKey: ['barbers'] });
      queryClient.refetchQueries({ queryKey: ['public-barbers'] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('barbers').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-barbers'] });
    },
  });

  const resetForm = () => {
    setFormData({ display_name: '', specialty: '', email: '', password: '', commission_percentage: '50', can_add_clients_directly: false });
    setCreateMode('with-login'); // Default to "with-login" so employees can access the system
  };

  const handleEdit = (barber: Barber) => {
    setEditingBarber(barber);
    setFormData({
      display_name: barber.display_name,
      specialty: barber.specialty || '',
      email: '',
      password: '',
      commission_percentage: String(barber.commission_percentage || 50),
      can_add_clients_directly: barber.can_add_clients_directly || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBarber) {
      updateMutation.mutate({ 
        id: editingBarber.id, 
        data: { 
          display_name: formData.display_name,
          specialty: formData.specialty || null,
          commission_percentage: parseFloat(formData.commission_percentage) || 50,
          can_add_clients_directly: formData.can_add_clients_directly,
        } 
      });
    } else if (createMode === 'with-login') {
      createWithLoginMutation.mutate(formData);
    } else {
      createSimpleMutation.mutate(formData);
    }
  };

  const isPending = createSimpleMutation.isPending || createWithLoginMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl uppercase">Barbeiros</h1>
            <p className="text-muted-foreground">Gerencie a equipe da barbearia</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingBarber(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus size={20} className="mr-2" />
                Novo Barbeiro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}</DialogTitle>
                {!editingBarber && (
                  <DialogDescription>
                    Adicione um barbeiro simples ou crie um funcionário com acesso ao sistema.
                  </DialogDescription>
                )}
              </DialogHeader>

              {!editingBarber ? (
                <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'simple' | 'with-login')} defaultValue="with-login">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple" className="text-xs sm:text-sm">
                      📋 Apenas Registro
                    </TabsTrigger>
                    <TabsTrigger value="with-login" className="text-xs sm:text-sm">
                      🔐 Com Acesso ao Sistema
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="simple">
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={formData.display_name}
                          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                          placeholder="Nome do barbeiro"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidade</Label>
                        <Input
                          id="specialty"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          placeholder="Ex: Corte clássico, Barba..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commission">Comissão (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="commission"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={formData.commission_percentage}
                            onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                            placeholder="50"
                            className="w-24"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="animate-spin mr-2" size={18} />}
                        Adicionar Barbeiro
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="with-login">
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground mb-4">
                        <p className="font-medium text-foreground mb-1">Funcionário com acesso ao painel</p>
                        <p>O funcionário poderá fazer login com o email e senha que você definir. Ele poderá alterar a senha depois.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name-login">Nome do Funcionário</Label>
                        <Input
                          id="name-login"
                          value={formData.display_name}
                          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                          placeholder="Nome completo"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty-login">Especialidade</Label>
                        <Input
                          id="specialty-login"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          placeholder="Ex: Corte clássico, Barba..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commission-login">Comissão (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="commission-login"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={formData.commission_percentage}
                            onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                            placeholder="50"
                            className="w-24"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Mail size={14} className="inline mr-1" />
                          Email de acesso
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="funcionario@barbearia.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          <Lock size={14} className="inline mr-1" />
                          Senha inicial
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Mínimo 8 caracteres com 1 número"
                          minLength={8}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Informe esta senha ao funcionário. Ele pode alterá-la em "Configurações da Conta".
                        </p>
                      </div>
                      <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="animate-spin mr-2" size={18} />}
                        Criar Funcionário com Acesso
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome</Label>
                    <Input
                      id="edit-name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Nome do barbeiro"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-specialty">Especialidade</Label>
                    <Input
                      id="edit-specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Ex: Corte clássico, Barba..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-commission">Comissão (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="edit-commission"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.commission_percentage}
                        onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                        placeholder="50"
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Porcentagem do valor cobrado que vai para o barbeiro
                    </p>
                  </div>
                  
                  {/* Permission Toggle - Only shown when editing */}
                  {editingBarber?.user_id && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-primary" />
                          <div>
                            <p className="text-sm font-medium">Liberar Entrada Direta</p>
                            <p className="text-xs text-muted-foreground">
                              Permite adicionar clientes na fila sem aprovação do admin
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.can_add_clients_directly}
                          onCheckedChange={(checked) => setFormData({ ...formData, can_add_clients_directly: checked })}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin mr-2" size={18} />}
                    Salvar Alterações
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barbers?.map((barber) => (
              <Card key={barber.id} className={!barber.is_active ? 'opacity-50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{barber.display_name}</CardTitle>
                      {barber.user_id && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Login
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(barber)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteBarber(barber)}
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {barber.specialty && (
                    <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                  )}
                  
                  {/* Commission Badge */}
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium">Comissão:</span>
                    <span className="font-bold">{barber.commission_percentage}%</span>
                  </div>
                  
                  {/* Direct Queue Access Badge */}
                  {barber.can_add_clients_directly && (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-2 rounded-lg">
                      <Users size={14} />
                      <span className="text-sm font-medium">Pode adicionar clientes</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {barber.is_available ? (
                        <UserCheck size={16} className="text-success" />
                      ) : (
                        <UserX size={16} className="text-muted-foreground" />
                      )}
                      <span className="text-sm">Disponível</span>
                    </div>
                    <Switch
                      checked={barber.is_available}
                      onCheckedChange={(checked) =>
                        toggleAvailability.mutate({ id: barber.id, is_available: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ativo</span>
                    <Switch
                      checked={barber.is_active}
                      onCheckedChange={(checked) =>
                        toggleActive.mutate({ id: barber.id, is_active: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteBarber} onOpenChange={() => setDeleteBarber(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover barbeiro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O barbeiro "{deleteBarber?.display_name}" será removido permanentemente.
                {deleteBarber?.user_id && (
                  <span className="block mt-2 text-destructive">
                    Atenção: Este barbeiro possui login no sistema. A conta de acesso também será desvinculada.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBarber && deleteMutation.mutate(deleteBarber.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBarbeiros;
