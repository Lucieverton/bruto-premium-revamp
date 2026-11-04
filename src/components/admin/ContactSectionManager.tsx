import { useEffect, useRef, useState } from 'react';
import { Loader2, Save, Undo2, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSiteTexts, useSaveSiteTexts } from '@/hooks/useSiteImages';
import { CONTACT_KEYS, UFS, formatAddress, mapsUrl, maskCep, resolveContact, type ContactKey } from '@/lib/siteContactDefaults';

type Form = Record<ContactKey, string>;

export const ContactSectionManager = () => {
  const { data: texts, isLoading } = useSiteTexts();
  const save = useSaveSiteTexts();
  const { toast } = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const init = useRef(false);

  useEffect(() => {
    if (!texts || init.current) return;
    const r = resolveContact(texts);
    setForm(r); setSaved(r); init.current = true;
  }, [texts]);

  if (!form || !saved) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  const set = (k: ContactKey, v: string) => setForm((f) => ({ ...(f as Form), [k]: v }));
  const dirty = CONTACT_KEYS.some((k) => form[k] !== saved[k]);

  const lookupCep = async (cep: string) => {
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j.erro) { toast({ title: 'CEP não encontrado', variant: 'destructive' }); return; }
      setForm((f) => ({
        ...(f as Form),
        contact_street: j.logradouro || f!.contact_street,
        contact_district: j.bairro || f!.contact_district,
        contact_city: j.localidade || f!.contact_city,
        contact_state: j.uf || f!.contact_state,
      }));
      toast({ title: 'Endereço preenchido pelo CEP', description: 'Confira o número e o complemento.' });
    } catch {
      toast({ title: 'Não foi possível buscar o CEP', variant: 'destructive' });
    } finally { setCepLoading(false); }
  };

  const handleSave = async () => {
    if (!form.contact_street.trim() || !form.contact_city.trim()) {
      toast({ title: 'Preencha ao menos rua e cidade', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync(form);
      setSaved(form);
      toast({ title: 'Endereço atualizado no site' });
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const field = (k: ContactKey, label: string, opts: { placeholder?: string; className?: string; inputMode?: 'numeric' | 'text' } = {}) => (
    <div className={`space-y-1.5 ${opts.className ?? ''}`}>
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={form[k]} placeholder={opts.placeholder} inputMode={opts.inputMode} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Endereço da barbearia</CardTitle>
          <CardDescription>Digite o CEP para preencher automaticamente. Aparece na seção "Entre em contato".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact_zip">CEP</Label>
              <div className="relative">
                <Input
                  id="contact_zip" inputMode="numeric" placeholder="00000-000" value={form.contact_zip}
                  onChange={(e) => { const v = maskCep(e.target.value); set('contact_zip', v); if (v.length === 9) lookupCep(v); }}
                />
                {cepLoading && <Loader2 size={16} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_state">Estado</Label>
              <select
                id="contact_state" value={form.contact_state} onChange={(e) => set('contact_state', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">UF</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {field('contact_street', 'Rua / Avenida', { placeholder: 'Ex.: Rua da Codeal' })}
          <div className="grid grid-cols-2 gap-3">
            {field('contact_number', 'Número', { placeholder: '144 ou S/N' })}
            {field('contact_complement', 'Complemento', { placeholder: 'Sala, loja…' })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('contact_district', 'Bairro')}
            {field('contact_city', 'Cidade')}
          </div>
          {field('contact_reference', 'Ponto de referência (opcional)', { placeholder: 'Ex.: ao lado da farmácia' })}
          <div className="space-y-1.5">
            <Label htmlFor="contact_maps_url">Link do Google Maps (opcional)</Label>
            <Input id="contact_maps_url" value={form.contact_maps_url} placeholder="Deixe vazio para gerar pelo endereço" onChange={(e) => set('contact_maps_url', e.target.value)} />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-xs text-muted-foreground">Prévia no site:</p>
            <div className="flex items-start gap-2">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <div className="text-sm break-words">
                <p>{formatAddress(form) || '—'}</p>
                {form.contact_reference && <p className="text-muted-foreground text-xs">{form.contact_reference}</p>}
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={mapsUrl(form)} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Abrir no mapa</a>
            </Button>
          </div>

          {dirty && <p className="text-xs text-primary">Alterações não salvas</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} disabled={save.isPending || isLoading || !dirty} className="flex-1">
              {save.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar endereço
            </Button>
            <Button variant="outline" onClick={() => setForm(saved)} disabled={!dirty}>
              <Undo2 size={16} /> Desfazer alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
