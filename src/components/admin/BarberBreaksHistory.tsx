import { useState, useMemo } from 'react';
import { History, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useBarberBreaks,
  useBarberBreaksRealtime,
  reasonLabel,
  formatDuration,
  PAUSE_LIMIT_MINUTES,
} from '@/hooks/useBarberAvailability';


interface Option {
  id: string;
  display_name: string;
}

const toDate = (value: string, endOfDay = false) => {
  const d = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  return d;
};

export const BarberBreaksHistory = ({ barbers }: { barbers: Option[] }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [day, setDay] = useState(today);
  const [barberId, setBarberId] = useState<string>('all');

  useBarberBreaksRealtime();

  const { data, isLoading } = useBarberBreaks(
    toDate(day),
    toDate(day, true),
    barberId === 'all' ? null : barberId
  );

  const summary = useMemo(() => {
    const rows = data ?? [];
    const byBarber = new Map<string, { name: string; count: number; minutes: number; overruns: number }>();
    for (const b of rows) {
      const cur = byBarber.get(b.barber_id) ?? { name: b.barber_name, count: 0, minutes: 0, overruns: 0 };
      cur.count += 1;
      cur.minutes += b.duration_minutes;
      if (b.is_overrun) cur.overruns += 1;
      byBarber.set(b.barber_id, cur);
    }
    return Array.from(byBarber.values()).sort((a, b) => b.minutes - a.minutes);
  }, [data]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History size={18} className="text-primary" />
          Histórico de pausas e ausências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="break-day">Dia</Label>
            <Input
              id="break-day"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Barbeiro</Label>
            <Select value={barberId} onValueChange={setBarberId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma pausa registrada neste dia.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summary.map((s) => (
                <div
                  key={s.name}
                  className="rounded-lg border border-border bg-background p-3 text-sm"
                >
                  <p className="font-medium break-words">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.count} {s.count === 1 ? 'pausa' : 'pausas'} · {formatDuration(s.minutes)} fora
                  </p>
                  {s.overruns > 0 && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive mt-1">
                      <AlertTriangle size={12} /> {s.overruns}{' '}
                      {s.overruns === 1 ? 'pausa estourada' : 'pausas estouradas'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Considera-se estouro passar da previsão de retorno, ou ficar mais de{' '}
              {PAUSE_LIMIT_MINUTES} min em pausa sem previsão.
            </p>

            <div className="space-y-2">
              {data.map((b) => (
                <div
                  key={b.id}
                  className={
                    b.is_overrun
                      ? 'rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm space-y-1'
                      : 'rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1'
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium break-words">{b.barber_name}</span>
                    <span
                      className={
                        b.ended_at
                          ? 'text-xs text-muted-foreground'
                          : 'text-xs font-medium text-warning'
                      }
                    >
                      {b.ended_at ? 'Encerrada' : 'Em andamento'}
                    </span>
                  </div>
                  <p className="text-muted-foreground break-words">
                    {b.state === 'offline' ? 'Fora do expediente' : 'Pausa'} ·{' '}
                    {reasonLabel(b.reason)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.started_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' → '}
                    {b.ended_at
                      ? new Date(b.ended_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'agora'}{' '}
                    · {formatDuration(b.duration_minutes)}
                  </p>
                  {b.is_overrun && b.state !== 'offline' && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertTriangle size={12} /> Estourou {formatDuration(b.overrun_minutes)} do
                      previsto
                    </p>
                  )}
                  {b.note && (
                    <p className="text-xs text-muted-foreground break-words">“{b.note}”</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
};
