import { Coffee, UserCheck, UserX, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  reasonLabel,
  useForceBarberStatus,
  minutesSince,
  formatDuration,
  pauseOverrunMinutes,
} from '@/hooks/useBarberAvailability';

interface BarberStatusInfo {
  id: string;
  status: string;
  is_available: boolean;
  pause_reason?: string | null;
  pause_note?: string | null;
  pause_expected_return?: string | null;
  status_changed_at?: string | null;
}

export const BarberStatusBadge = ({ barber }: { barber: BarberStatusInfo }) => {
  const force = useForceBarberStatus();
  const elapsed = minutesSince(barber.status_changed_at);

  const isBusy = barber.status === 'busy';
  const isPaused = barber.status === 'paused';
  const isOnline = barber.status === 'online' && barber.is_available;
  const overrun = pauseOverrunMinutes(barber);
  const longAbsence = !isOnline && !isBusy && !isPaused && elapsed > 60;

  const state = isBusy ? 'busy' : isPaused ? 'paused' : isOnline ? 'online' : 'offline';

  const styles: Record<string, string> = {
    busy: 'bg-destructive/10 border-destructive/30 text-destructive',
    paused: 'bg-warning/10 border-warning/40 text-warning',
    online: 'bg-success/10 border-success/30 text-success',
    offline: 'bg-muted/50 border-border text-muted-foreground',
  };

  const labels: Record<string, string> = {
    busy: 'Em atendimento',
    paused: `Em pausa — ${reasonLabel(barber.pause_reason)}`,
    online: 'Disponível',
    offline: 'Fora do expediente',
  };


  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 space-y-2',
        overrun > 0 ? 'bg-destructive/10 border-destructive/40 text-destructive' : styles[state]
      )}
    >
      <div className="flex items-start gap-2">
        {state === 'busy' && <Loader2 size={15} className="animate-spin mt-0.5 shrink-0" />}
        {state === 'paused' && <Coffee size={15} className="mt-0.5 shrink-0" />}
        {state === 'online' && <UserCheck size={15} className="mt-0.5 shrink-0" />}
        {state === 'offline' && <UserX size={15} className="mt-0.5 shrink-0" />}
        <div className="min-w-0 text-sm">
          <p className="font-medium break-words">{labels[state]}</p>
          <p className="text-xs opacity-80 break-words">
            há {formatDuration(elapsed)}
            {isPaused && barber.pause_expected_return && (
              <> · volta ~
                {new Date(barber.pause_expected_return).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
          </p>
          {barber.pause_note && (
            <p className="text-xs opacity-80 break-words mt-0.5">“{barber.pause_note}”</p>
          )}
        </div>
      </div>

      {overrun > 0 && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
          <AlertTriangle size={13} /> Pausa estourada — atrasado há {formatDuration(overrun)}
        </p>
      )}

      {longAbsence && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertTriangle size={13} /> Ausente há mais de 1 hora
        </p>
      )}


      <div className="flex flex-wrap gap-2">
        {!isOnline && !isBusy && (
          <Button
            size="sm"
            variant="outline"
            disabled={force.isPending}
            onClick={() => force.mutate({ barberId: barber.id, state: 'available' })}
          >
            Forçar retorno
          </Button>
        )}
        {isOnline && (
          <Button
            size="sm"
            variant="outline"
            disabled={force.isPending}
            onClick={() => force.mutate({ barberId: barber.id, state: 'offline' })}
          >
            Tirar da fila
          </Button>
        )}
      </div>
    </div>
  );
};
