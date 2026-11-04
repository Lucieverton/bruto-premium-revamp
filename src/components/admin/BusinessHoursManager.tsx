import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSaveSiteTexts } from '@/hooks/useSiteImages';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { DAY_NAMES, HOURS_KEY, WeekHours, formatWeeklyHours } from '@/lib/siteHoursDefaults';

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export const BusinessHoursManager = () => {
  const { week } = useBusinessHours();
  const save = useSaveSiteTexts();
  const [form, setForm] = useState<WeekHours>(week);
  const weekJson = JSON.stringify(week);

  useEffect(() => { setForm(JSON.parse(weekJson)); }, [weekJson]);

  const update = (i: number, patch: Partial<WeekHours[number]>) =>
    setForm((f) => f.map((d, k) => (k === i ? { ...d, ...patch } : d)));

  const dirty = JSON.stringify(form) !== weekJson;

  const onSave = async () => {
    for (const i of ORDER) {
      const d = form[i];
      if (d.open && (!d.start || !d.end || d.start >= d.end)) {
        toast.error(`${DAY_NAMES[i]}: o horário de fechar deve ser depois do de abrir.`);
        return;
      }
    }
    try {
      await save.mutateAsync({ [HOURS_KEY]: JSON.stringify(form) });
      // Mantém o horário antigo da fila alinhado (usa o horário de segunda/padrão).
      const ref = form.slice(1).find((d) => d.open) ?? form[0];
      const { data } = await supabase.from('queue_settings').select('id').limit(1).maybeSingle();
      if (data?.id) {
        await supabase.from('queue_settings').update({ opening_time: ref.start, closing_time: ref.end }).eq('id', data.id);
      }
      toast.success('Horário salvo no site e na fila.');
    } catch {
      toast.error('Não foi possível salvar o horário.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock size={20} /> Horário de funcionamento</CardTitle>
        <CardDescription>Aparece igual no site e na fila. A fila só abre/fecha pelo botão "Fila ativa".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ORDER.map((i) => {
          const d = form[i];
          return (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{DAY_NAMES[i]}</span>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  {d.open ? 'Aberto' : 'Fechado'}
                  <Switch checked={d.open} onCheckedChange={(v) => update(i, { open: v })} />
                </label>
              </div>
              {d.open && (
                <div className="grid grid-cols-2 gap-2">
                  <Input type="time" value={d.start} onChange={(e) => update(i, { start: e.target.value })} aria-label={`${DAY_NAMES[i]} abre`} />
                  <Input type="time" value={d.end} onChange={(e) => update(i, { end: e.target.value })} aria-label={`${DAY_NAMES[i]} fecha`} />
                </div>
              )}
              {i === 0 && d.open && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!d.firstTwoOnly} onCheckedChange={(v) => update(0, { firstTwoOnly: !!v })} />
                  Apenas 1º e 2º domingo do mês
                </label>
              )}
            </div>
          );
        })}

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium mb-1">Como vai aparecer no site:</p>
          {formatWeeklyHours(form).map((l) => <p key={l} className="text-muted-foreground">{l}</p>)}
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!dirty || save.isPending} className="flex-1">
            {save.isPending ? 'Salvando...' : 'Salvar horário'}
          </Button>
          {dirty && <Button variant="outline" onClick={() => setForm(JSON.parse(weekJson))}>Desfazer</Button>}
        </div>
      </CardContent>
    </Card>
  );
};
