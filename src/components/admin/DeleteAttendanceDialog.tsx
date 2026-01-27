import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type DeleteOption = 'single' | 'today' | 'week' | 'month' | 'year' | 'all';

const deleteOptions: { value: DeleteOption; label: string; description: string }[] = [
  { value: 'today', label: 'Apenas Hoje', description: 'Excluir todos os registros de hoje' },
  { value: 'week', label: 'Esta Semana', description: 'Excluir registros dos últimos 7 dias' },
  { value: 'month', label: 'Este Mês', description: 'Excluir registros dos últimos 30 dias' },
  { value: 'year', label: 'Este Ano', description: 'Excluir registros do ano atual' },
  { value: 'all', label: 'Todos', description: 'Excluir TODOS os registros do sistema' },
];

const CONFIRMATION_WORD = 'EXCLUIR';

export const DeleteAttendanceDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DeleteOption>('today');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (option: DeleteOption) => {
      const now = new Date();
      let filterDate: string | null = null;
      
      switch (option) {
        case 'today': {
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          filterDate = todayStart.toISOString();
          break;
        }
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filterDate = weekAgo.toISOString();
          break;
        }
        case 'month': {
          const monthAgo = new Date(now);
          monthAgo.setDate(monthAgo.getDate() - 30);
          filterDate = monthAgo.toISOString();
          break;
        }
        case 'year': {
          const yearStart = new Date(now.getFullYear(), 0, 1);
          filterDate = yearStart.toISOString();
          break;
        }
        case 'all': {
          filterDate = null;
          break;
        }
      }

      // Build and execute delete query
      let deleteQuery = supabase.from('attendance_records').delete();
      
      if (filterDate) {
        deleteQuery = deleteQuery.gte('completed_at', filterDate);
      } else {
        // Delete all - use a condition that matches all records
        deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error: deleteError } = await deleteQuery;
      if (deleteError) throw deleteError;

      return true;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['barber-earnings'] });
      
      toast({
        title: 'Registros excluídos',
        description: `${count} registro(s) foram excluídos com sucesso.`,
      });
      
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setShowConfirmation(false);
    setConfirmationInput('');
    setSelectedOption('today');
  };

  const handleDelete = () => {
    if (confirmationInput !== CONFIRMATION_WORD) {
      toast({
        title: 'Confirmação incorreta',
        description: `Digite "${CONFIRMATION_WORD}" para confirmar a exclusão.`,
        variant: 'destructive',
      });
      return;
    }
    
    deleteMutation.mutate(selectedOption);
  };

  const selectedLabel = deleteOptions.find(o => o.value === selectedOption)?.label || '';

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 size={20} />
            Excluir Registros de Atendimento
          </CardTitle>
          <CardDescription>
            Remove registros de atendimento do sistema. Esta ação é irreversível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2" size={16} />
            Gerenciar Exclusão de Registros
          </Button>
        </CardContent>
      </Card>

      {/* Selection Dialog */}
      <Dialog open={isOpen && !showConfirmation} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Excluir Registros
            </DialogTitle>
            <DialogDescription>
              Selecione quais registros de atendimento deseja excluir. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={selectedOption}
            onValueChange={(v) => setSelectedOption(v as DeleteOption)}
            className="space-y-3"
          >
            {deleteOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedOption(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                <Label htmlFor={option.value} className="cursor-pointer flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowConfirmation(true)}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="text-destructive" size={20} />
              Tem certeza que deseja excluir?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div>
                Você está prestes a excluir registros: <strong className="text-foreground">{selectedLabel}</strong>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30 text-destructive text-sm">
                <strong>⚠️ ATENÇÃO:</strong> Esta ação é irreversível! Todos os dados de atendimento, incluindo valores e métodos de pagamento, serão permanentemente removidos.
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Digite <strong className="text-destructive">{CONFIRMATION_WORD}</strong> para confirmar:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value.toUpperCase())}
                  placeholder={CONFIRMATION_WORD}
                  className="uppercase"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmationInput !== CONFIRMATION_WORD || deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2" size={16} />
                  Excluir Permanentemente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
