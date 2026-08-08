import { useEffect, useState } from 'react';
import { Loader2, Save, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ImageSlotCard } from './ImageSlotCard';
import { useSiteTexts, useSaveSiteTexts, useSiteImages } from '@/hooks/useSiteImages';
import { ABOUT_DEFAULTS, type AboutTextKey } from '@/lib/siteAboutDefaults';

import defaultFront from '@/assets/barbershop-front-nobg.png';
import defaultInterior from '@/assets/barbershop-interior.jpg';

const FIELDS: {
  key: AboutTextKey;
  label: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
}[] = [
  { key: 'about_title', label: 'Título da seção', hint: 'Aparece no topo da seção do site.' },
  { key: 'about_p1', label: 'Texto de abertura', multiline: true, rows: 2 },
  { key: 'about_p2', label: 'Sobre a equipe', multiline: true, rows: 4 },
  { key: 'about_p3', label: 'Texto complementar', multiline: true, rows: 3 },
  { key: 'about_highlight', label: 'Frase de destaque', hint: 'Exibida em verde, no final da seção.' },
];

export const AboutSectionManager = () => {
  const { data: texts, isLoading } = useSiteTexts();
  const { data: images } = useSiteImages();
  const saveTexts = useSaveSiteTexts();
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!texts) return;
    const next: Record<string, string> = {};
    (Object.keys(ABOUT_DEFAULTS) as AboutTextKey[]).forEach((k) => {
      next[k] = texts[k] ?? '';
    });
    setForm(next);
  }, [texts]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    try {
      await saveTexts.mutateAsync(form);
      toast({ title: 'Seção "Sobre nós" atualizada' });
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleResetTexts = async () => {
    const defaults = Object.fromEntries(
      Object.entries(ABOUT_DEFAULTS).map(([k, v]) => [k, v as string]),
    );
    setForm(defaults);
    try {
      await saveTexts.mutateAsync(defaults);
      toast({ title: 'Textos restaurados para o padrão' });
    } catch (e) {
      toast({ title: 'Erro ao restaurar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const caption1 = form.about_caption_1 || ABOUT_DEFAULTS.about_caption_1;
  const caption2 = form.about_caption_2 || ABOUT_DEFAULTS.about_caption_2;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">As duas imagens da seção</CardTitle>
          <CardDescription>
            Podem ser qualquer foto que você quiser (equipe, ambiente, cortes, fachada…). A primeira
            aparece na frente do cartão e a segunda ao virar/passar o mouse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ImageSlotCard
                slot="about_front"
                label="Imagem 1 (frente do cartão)"
                description="Aparece primeiro para o cliente"
                fallback={defaultFront}
                aspect={4 / 3}
                aspectLabel="4:3"
                transparent
              />
              <div className="space-y-1.5">
                <Label htmlFor="cap1" className="text-xs">Legenda da imagem 1</Label>
                <Input
                  id="cap1"
                  value={form.about_caption_1 ?? ''}
                  placeholder={ABOUT_DEFAULTS.about_caption_1}
                  onChange={(e) => set('about_caption_1', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <ImageSlotCard
                slot="about_interior"
                label="Imagem 2 (verso do cartão)"
                description="Aparece ao virar o cartão"
                fallback={defaultInterior}
                aspect={4 / 3}
                aspectLabel="4:3"
              />
              <div className="space-y-1.5">
                <Label htmlFor="cap2" className="text-xs">Legenda da imagem 2</Label>
                <Input
                  id="cap2"
                  value={form.about_caption_2 ?? ''}
                  placeholder={ABOUT_DEFAULTS.about_caption_2}
                  onChange={(e) => set('about_caption_2', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              As legendas aparecem logo abaixo das imagens no site. Deixe em branco para usar o texto
              padrão ({ABOUT_DEFAULTS.about_caption_1} / {ABOUT_DEFAULTS.about_caption_2}).
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Textos abaixo das imagens</CardTitle>
          <CardDescription>Escreva do seu jeito. Salve para publicar no site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.multiline ? (
                <Textarea
                  id={f.key}
                  rows={f.rows ?? 3}
                  value={form[f.key] ?? ''}
                  placeholder={ABOUT_DEFAULTS[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <Input
                  id={f.key}
                  value={form[f.key] ?? ''}
                  placeholder={ABOUT_DEFAULTS[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}

          <Separator />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} disabled={saveTexts.isPending || isLoading} className="flex-1">
              {saveTexts.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Salvar textos
            </Button>
            <Button variant="outline" onClick={handleResetTexts} disabled={saveTexts.isPending}>
              <RotateCcw size={16} />
              Restaurar padrão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Prévia</CardTitle>
          <CardDescription>Assim os clientes vão ver a seção.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <h3 className="font-display text-xl uppercase text-center">
              {form.about_title || ABOUT_DEFAULTS.about_title}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { url: images?.about_front?.url || defaultFront, cap: caption1 },
                { url: images?.about_interior?.url || defaultInterior, cap: caption2 },
              ].map((img, i) => (
                <figure key={i} className="space-y-1">
                  <img
                    src={img.url}
                    alt={img.cap}
                    className="w-full aspect-[4/3] object-cover rounded-md border border-border"
                  />
                  <figcaption className="text-xs text-center text-muted-foreground">
                    {img.cap}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="space-y-2 text-center">
              {(['about_p1', 'about_p2', 'about_p3'] as AboutTextKey[]).map((k) => (
                <p key={k} className="text-sm text-muted-foreground">
                  {form[k] || ABOUT_DEFAULTS[k]}
                </p>
              ))}
              <p className="text-sm font-semibold text-primary">
                {form.about_highlight || ABOUT_DEFAULTS.about_highlight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
