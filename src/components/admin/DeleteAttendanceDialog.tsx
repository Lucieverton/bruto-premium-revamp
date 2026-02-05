import { useState, useMemo } from 'react';
import { Trash2, AlertTriangle, Loader2, Search, Calendar } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DeleteOption = 'single' | 'today' | 'week' | 'month' | 'year' | 'all';

interface AttendanceService {
  service_name: string;
  price_charged: number;
}

interface AttendanceRecord {
  id: string;
  customer_name: string;
  price_charged: number;
  completed_at: string;
  payment_method: string | null;
  services: AttendanceService[];
  barber_name?: string;
}

const deleteOptions: { value: DeleteOption; label: string; description: string }[] = [
  { value: 'single', label: 'Um Único Registro', description: 'Excluir um atendimento específico por data' },
  { value: 'today', label: 'Apenas Hoje', description: 'Excluir todos os registros de hoje' },
  { value: 'week', label: 'Esta Semana', description: 'Excluir registros dos últimos 7 dias' },
  { value: 'month', label: 'Este Mês', description: 'Excluir registros dos últimos 30 dias' },
  { value: 'year', label: 'Este Ano', description: 'Excluir registros do ano atual' },
  { value: 'all', label: 'Todos', description: 'Excluir TODOS os registros do sistema' },
];

const CONFIRMATION_WORD = 'EXCLUIR';

export const DeleteAttendanceDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DeleteOption>('single');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showSingleSelection, setShowSingleSelection] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch records for single deletion
  const { data: dateRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ['attendance-for-deletion', selectedDate],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate + 'T00:00:00');
      const endOfDay = new Date(selectedDate + 'T23:59:59');
      
      const { data, error } = await supabase.rpc('get_attendance_with_services', {
        p_start_date: startOfDay.toISOString(),
        p_end_date: endOfDay.toISOString(),
      });

      if (error) throw error;

      // Also get barber names
      const { data: barbers } = await supabase.from('barbers').select('id, display_name');
      const barberMap = new Map(barbers?.map(b => [b.id, b.display_name]) || []);

      return (data || []).map((record: any) => ({
        id: record.id,
        customer_name: record.customer_name,
        price_charged: Number(record.price_charged),
        completed_at: record.completed_at,
        payment_method: record.payment_method,
        services: (record.services as unknown as AttendanceService[]) || [],
        barber_name: barberMap.get(record.barber_id) || 'Não informado',
      })) as AttendanceRecord[];
    },
    enabled: showSingleSelection,
  });

  const filteredRecords = useMemo(() => {
    if (!dateRecords) return [];
    if (!searchTerm.trim()) return dateRecords;
    
    const term = searchTerm.toLowerCase();
    return dateRecords.filter(record => 
      record.customer_name.toLowerCase().includes(term) ||
      record.services.some(s => s.service_name.toLowerCase().includes(term)) ||
      record.barber_name?.toLowerCase().includes(term)
    );
  }, [dateRecords, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: async (option: DeleteOption) => {
      if (option === 'single' && selectedRecordId) {
        // Delete single record
        const { error } = await supabase
          .from('attendance_records')
          .delete()
          .eq('id', selectedRecordId);
        
        if (error) throw error;
        return 1;
      }

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

      let deleteQuery = supabase.from('attendance_records').delete();
      
      if (filterDate) {
        deleteQuery = deleteQuery.gte('completed_at', filterDate);
      } else {
        deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error: deleteError } = await deleteQuery;
      if (deleteError) throw deleteError;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-for-deletion'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['barber-earnings'] });
      
      toast({
        title: 'Registro excluído',
        description: selectedOption === 'single' 
          ? 'O atendimento foi excluído com sucesso.'
          : 'Os registros foram excluídos com sucesso.',
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
    setShowSingleSelection(false);
    setConfirmationInput('');
    setSelectedOption('single');
    setSelectedRecordId(null);
    setSearchTerm('');
  };

  const handleContinue = () => {
    if (selectedOption === 'single') {
      setShowSingleSelection(true);
    } else {
      setShowConfirmation(true);
    }
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecordId(recordId);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (selectedOption !== 'single' && confirmationInput !== CONFIRMATION_WORD) {
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
  const selectedRecord = dateRecords?.find(r => r.id === selectedRecordId);

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
      <Dialog open={isOpen && !showConfirmation && !showSingleSelection} onOpenChange={setIsOpen}>
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
              onClick={handleContinue}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Record Selection Dialog */}
      <Dialog open={showSingleSelection} onOpenChange={(open) => !open && setShowSingleSelection(false)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Selecionar Atendimento
            </DialogTitle>
            <DialogDescription>
              Escolha a data e selecione o atendimento que deseja excluir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Date Selector */}
            <div className="space-y-2">
              <Label htmlFor="date-select">Data do Atendimento</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por cliente, serviço ou barbeiro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Records List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {loadingRecords ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin mr-2" size={20} />
                  <span className="text-muted-foreground">Carregando...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum atendimento encontrado para esta data.
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <Card
                    key={record.id}
                    className="cursor-pointer hover:border-destructive/50 transition-colors"
                    onClick={() => handleSelectRecord(record.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{record.customer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(record.completed_at), 'HH:mm', { locale: ptBR })} • {record.barber_name}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.services.map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {service.service_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-destructive">
                            R$ {record.price_charged.toFixed(2).replace('.', ',')}
                          </div>
                          {record.payment_method && (
                            <Badge variant="outline" className="text-xs">
                              {record.payment_method}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSingleSelection(false)}>
              Voltar
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
              {selectedOption === 'single' && selectedRecord ? (
                <div className="space-y-2">
                  <div>Você está prestes a excluir o atendimento:</div>
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="font-medium">{selectedRecord.customer_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedRecord.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRecord.services.map((service, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {service.service_name} - R$ {service.price_charged.toFixed(2).replace('.', ',')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div>
                  Você está prestes a excluir registros: <strong className="text-foreground">{selectedLabel}</strong>
                </div>
              )}
              
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30 text-destructive text-sm">
                <strong>⚠️ ATENÇÃO:</strong> Esta ação é irreversível! {selectedOption === 'single' 
                  ? 'O registro será permanentemente removido.'
                  : 'Todos os dados de atendimento, incluindo valores e métodos de pagamento, serão permanentemente removidos.'}
              </div>
              
              {selectedOption !== 'single' && (
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
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={(selectedOption !== 'single' && confirmationInput !== CONFIRMATION_WORD) || deleteMutation.isPending}
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
                  Excluir {selectedOption === 'single' ? 'Registro' : 'Permanentemente'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};