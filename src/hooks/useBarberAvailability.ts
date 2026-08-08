import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AvailabilityState = 'available' | 'paused' | 'offline';

export const PAUSE_REASONS: { value: string; label: string }[] = [
  { value: 'almoco', label: 'Almoço' },
  { value: 'lanche', label: 'Lanche / café' },
  { value: 'pessoal', label: 'Motivo pessoal' },
  { value: 'fora', label: 'Fora da barbearia' },
  { value: 'outro', label: 'Outro' },
];

export const REASON_LABELS: Record<string, string> = {
  ...Object.fromEntries(PAUSE_REASONS.map((r) => [r.value, r.label])),
  expediente_encerrado: 'Expediente encerrado',
  forcado_admin: 'Alterado pelo administrador',
};

export const reasonLabel = (reason?: string | null) =>
  reason ? REASON_LABELS[reason] ?? reason : '—';

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.refetchQueries({ queryKey: ['my-barber-profile'] });
  qc.refetchQueries({ queryKey: ['barbers'] });
  qc.refetchQueries({ queryKey: ['public-barbers'] });
  qc.refetchQueries({ queryKey: ['admin-barbers'] });
  qc.refetchQueries({ queryKey: ['available-barbers'] });
  qc.refetchQueries({ queryKey: ['barber-breaks'] });
};

export interface SetAvailabilityInput {
  barberId: string;
  state: AvailabilityState;
  reason?: string | null;
  note?: string | null;
  /** minutos de previsão de retorno; null = sem previsão */
  expectedMinutes?: number | null;
}

export const useSetBarberAvailability = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ barberId, state, reason, note, expectedMinutes }: SetAvailabilityInput) => {
      const expected =
        expectedMinutes && expectedMinutes > 0
          ? new Date(Date.now() + expectedMinutes * 60_000).toISOString()
          : null;

      const { error } = await supabase.rpc('barber_set_availability', {
        p_barber_id: barberId,
        p_state: state,
        p_reason: reason ?? null,
        p_note: note ?? null,
        p_expected_return: expected,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: (_, vars) => {
      invalidate(qc);
      const messages: Record<AvailabilityState, string> = {
        available: 'Você está disponível e recebendo clientes na fila.',
        paused: 'Você ficará em pausa até voltar manualmente. O sistema não vai te reativar.',
        offline: 'Expediente encerrado. Só você pode voltar a ficar disponível.',
      };
      toast({ title: 'Disponibilidade atualizada', description: messages[vars.state] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
};

export const useForceBarberStatus = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ barberId, state }: { barberId: string; state: AvailabilityState }) => {
      const { error } = await supabase.rpc('admin_force_barber_status', {
        p_barber_id: barberId,
        p_state: state,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      invalidate(qc);
      toast({ title: 'Status alterado', description: 'A alteração foi registrada no histórico.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
};

export interface BarberBreak {
  id: string;
  barber_id: string;
  barber_name: string;
  reason: string;
  note: string | null;
  state: string;
  expected_return: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  is_overrun: boolean;
  overrun_minutes: number;
}

/** Pausa sem previsão é considerada estourada após este tempo */
export const PAUSE_LIMIT_MINUTES = 30;

export const useBarberBreaks = (start: Date, end: Date, barberId?: string | null) => {
  return useQuery({
    queryKey: ['barber-breaks', start.toISOString(), end.toISOString(), barberId ?? 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_barber_breaks', {
        p_start: start.toISOString(),
        p_end: end.toISOString(),
        p_barber_id: barberId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as BarberBreak[];
    },
    // mantém as durações "em andamento" atualizadas
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
};

/** Atualiza o histórico de pausas em tempo real */
export const useBarberBreaksRealtime = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('barber-breaks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_breaks' },
        () => {
          qc.invalidateQueries({ queryKey: ['barber-breaks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barbers' },
        () => {
          qc.invalidateQueries({ queryKey: ['admin-barbers'] });
          qc.invalidateQueries({ queryKey: ['barbers'] });
          qc.invalidateQueries({ queryKey: ['my-barber-profile'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
};

/** Retorna quantos minutos a pausa em andamento passou do combinado (0 = dentro do prazo) */
export const pauseOverrunMinutes = (barber: {
  status?: string;
  pause_expected_return?: string | null;
  status_changed_at?: string | null;
}) => {
  if (barber.status !== 'paused') return 0;
  if (barber.pause_expected_return) {
    const diff = Date.now() - new Date(barber.pause_expected_return).getTime();
    return diff > 0 ? Math.floor(diff / 60_000) : 0;
  }
  const elapsed = minutesSince(barber.status_changed_at);
  return elapsed > PAUSE_LIMIT_MINUTES ? elapsed - PAUSE_LIMIT_MINUTES : 0;
};


export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
};

export const minutesSince = (iso?: string | null) => {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
};
