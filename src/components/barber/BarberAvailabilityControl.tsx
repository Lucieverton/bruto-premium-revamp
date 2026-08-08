import { useState } from 'react';
import { Coffee, UserCheck, UserX, Loader2, Info, Play, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import {
  PAUSE_REASONS,
  reasonLabel,
  useSetBarberAvailability,
  useBarberBreaksRealtime,
  minutesSince,
  formatDuration,
  pauseOverrunMinutes,
} from '@/hooks/useBarberAvailability';


interface BarberLike {
  id: string;
  status: string;
  is_available: boolean;
  pause_reason?: string | null;
  pause_note?: string | null;
  pause_expected_return?: string | null;
  status_changed_at?: string | null;
}

const RETURN_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: 'Sem previsão', value: 0 },
];

export const BarberAvailabilityControl = ({ barber }: { barber: BarberLike }) => {
  const setAvailability = useSetBarberAvailability();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [reason, setReason] = useState('almoco');
  const [note, setNote] = useState('');
  const [expected, setExpected] = useState<number>(30);

  useBarberBreaksRealtime();

  const isInService = barber.status === 'busy';
  const isPaused = barber.status === 'paused';
  const isAvailable = barber.status === 'online' && barber.is_available;
  const elapsed = minutesSince(barber.status_changed_at);
  const overrun = pauseOverrunMinutes(barber);


  const state = isInService ? 'busy' : isPaused ? 'paused' : isAvailable ? 'available' : 'offline';

  const stateStyles: Record<string, string> = {
    busy: 'bg-destructive/10 border-destructive/30',
    paused: 'bg-warning/10 border-warning/40',
    available: 'bg-success/10 border-success/30',
    offline: 'bg-muted/50 border-border',
  };

  const stateTitle: Record<string, string> = {
    busy: 'Em atendimento',
    paused: `Em pausa — ${reasonLabel(barber.pause_reason)}`,
    available: 'Disponível para atendimento',
    offline: 'Fora do expediente',
  };

  const stateDesc: Record<string, string> = {
    busy: 'Finalize o atendimento atual para alterar sua disponibilidade.',
    paused: 'Você não recebe novos clientes até voltar manualmente.',
    available: 'Você aparece na fila e pode receber novos clientes.',
    offline: 'Você não aparece como disponível na fila.',
  };

  const confirmPause = () => {
    setAvailability.mutate(
      { barberId: barber.id, state: 'paused', reason, note, expectedMinutes: expected || null },
      { onSuccess: () => { setPauseOpen(false); setNote(''); } }
    );
  };

  const confirmOffline = () => {
    setAvailability.mutate(
      { barberId: barber.id, state: 'offline', reason: 'expediente_encerrado', note },
      { onSuccess: () => { setOfflineOpen(false); setNote(''); } }
    );
  };

  return (
    <div className={cn('rounded-xl border p-4 space-y-4 transition-all', stateStyles[state])}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background/60 shrink-0">
          {state === 'busy' && <Loader2 size={20} className="text-destructive animate-spin" />}
          {state === 'paused' && <Coffee size={20} className="text-warning" />}
          {state === 'available' && <UserCheck size={20} className="text-success" />}
          {state === 'offline' && <UserX size={20} className="text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium break-words">{stateTitle[state]}</p>
          <p className="text-sm text-muted-foreground break-words">{stateDesc[state]}</p>
          {barber.pause_note && (isPaused || state === 'offline') && (
            <p className="text-sm text-muted-foreground break-words mt-1">“{barber.pause_note}”</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Neste estado há {formatDuration(elapsed)}
            {isPaused && barber.pause_expected_return && (
              <> · previsão de volta às{' '}
                {new Date(barber.pause_expected_return).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
          </p>
        </div>
      </div>

      {overrun > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs font-medium text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Sua pausa passou {formatDuration(overrun)} do previsto. O administrador consegue ver esse
          atraso.
        </p>
      )}

      {isInService && (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-background/60 p-2 text-xs text-muted-foreground">
          <Info size={14} className="mt-0.5 shrink-0" />
          Finalize o cliente que está atendendo para poder entrar em pausa ou encerrar o expediente.
        </p>
      )}


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          size="sm"
          variant={isAvailable ? 'default' : 'outline'}
          disabled={isInService || setAvailability.isPending || isAvailable}
          onClick={() => setAvailability.mutate({ barberId: barber.id, state: 'available' })}
        >
          <Play size={15} className="mr-2" />
          {isPaused || state === 'offline' ? 'Voltar ao atendimento' : 'Disponível'}
        </Button>
        <Button
          size="sm"
          variant={isPaused ? 'default' : 'outline'}
          disabled={isInService || setAvailability.isPending}
          onClick={() => setPauseOpen(true)}
        >
          <Coffee size={15} className="mr-2" />
          {isPaused ? 'Alterar pausa' : 'Entrar em pausa'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isInService || setAvailability.isPending || state === 'offline'}
          onClick={() => setOfflineOpen(true)}
        >
          <UserX size={15} className="mr-2" />
          Encerrar expediente
        </Button>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        O sistema nunca reativa você automaticamente. Só você (ou o administrador) pode voltar a
        deixar seu status como disponível.
      </p>

      {/* Pausa */}
      <AlertDialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Entrar em pausa</AlertDialogTitle>
            <AlertDialogDescription>
              Você deixa de receber novos clientes até voltar manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <div className="flex flex-wrap gap-2">
                {PAUSE_REASONS.map((r) => (
                  <Button
                    key={r.value}
                    type="button"
                    size="sm"
                    variant={reason === r.value ? 'default' : 'outline'}
                    onClick={() => setReason(r.value)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Previsão de retorno (apenas informativa)</Label>
              <div className="flex flex-wrap gap-2">
                {RETURN_OPTIONS.map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    size="sm"
                    variant={expected === o.value ? 'default' : 'outline'}
                    onClick={() => setExpected(o.value)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pause-note">Observação (opcional)</Label>
              <Textarea
                id="pause-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="Ex.: saí para resolver algo rápido"
                rows={2}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmPause(); }}>
              Confirmar pausa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Encerrar expediente */}
      <AlertDialog open={offlineOpen} onOpenChange={setOfflineOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar expediente</AlertDialogTitle>
            <AlertDialogDescription>
              Você sairá da fila até voltar manualmente. Nada será reativado sozinho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="offline-note">Observação (opcional)</Label>
            <Textarea
              id="offline-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="Ex.: folga, consulta médica..."
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmOffline(); }}>
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
