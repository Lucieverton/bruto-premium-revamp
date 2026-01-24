import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, UserCheck, UserX } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
}

const AdminBarbeiros = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deleteBarber, setDeleteBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    specialty: '',
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

  const createMutation = useMutation({
    mutationFn: async (data: { display_name: string; specialty: string }) => {
      const { error } = await supabase.from('barbers').insert({
        display_name: data.display_name,
        specialty: data.specialty || null,
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
      const { error } = await supabase.from('barbers').update({ is_available }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-barbers'] });
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
    setFormData({ display_name: '', specialty: '' });
  };

  const handleEdit = (barber: Barber) => {
    setEditingBarber(barber);
    setFormData({
      display_name: barber.display_name,
      specialty: barber.specialty || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBarber) {
      updateMutation.mutate({ id: editingBarber.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  )}
                  {editingBarber ? 'Salvar Alterações' : 'Adicionar Barbeiro'}
                </Button>
              </form>
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
                    <CardTitle className="text-lg">{barber.display_name}</CardTitle>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {barber.is_available ? (
                        <UserCheck size={16} className="text-green-500" />
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
