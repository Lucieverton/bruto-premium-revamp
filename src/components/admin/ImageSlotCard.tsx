import { useRef, useState } from 'react';
import { Upload, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ImageCropDialog } from './ImageCropDialog';
import {
  uploadSiteImage,
  useSaveSiteImage,
  useResetSiteImage,
  useSiteImages,
  type SiteImageSlot,
} from '@/hooks/useSiteImages';

interface ImageSlotCardProps {
  slot: SiteImageSlot;
  label: string;
  description?: string;
  fallback: string;
  aspect?: number;
  aspectLabel?: string;
  transparent?: boolean;
  previewClassName?: string;
}

export const ImageSlotCard = ({
  slot,
  label,
  description,
  fallback,
  aspect,
  aspectLabel,
  transparent,
  previewClassName = 'aspect-video',
}: ImageSlotCardProps) => {
  const { data: images } = useSiteImages();
  const saved = images?.[slot];
  const save = useSaveSiteImage();
  const reset = useResetSiteImage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Selecione um arquivo de imagem', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirm = async (blob: Blob) => {
    try {
      const url = await uploadSiteImage(blob, slot);
      await save.mutateAsync({ slot, url, alt: label });
      toast({ title: 'Imagem atualizada!' });
    } catch (err) {
      toast({
        title: 'Erro ao salvar imagem',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleReset = async () => {
    try {
      await reset.mutateAsync(slot);
      toast({ title: 'Imagem padrão restaurada' });
    } catch (err) {
      toast({ title: 'Erro ao restaurar', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold break-words">{label}</p>
            {description && (
              <p className="text-xs text-muted-foreground break-words">{description}</p>
            )}
          </div>
          <Badge variant={saved ? 'default' : 'secondary'} className="shrink-0">
            {saved ? 'Personalizada' : 'Padrão'}
          </Badge>
        </div>

        <div className={`w-full ${previewClassName} bg-muted/40 rounded-md overflow-hidden flex items-center justify-center`}>
          <img
            src={saved?.url || fallback}
            alt={label}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        {aspectLabel && (
          <p className="text-xs text-muted-foreground">Proporção recomendada: {aspectLabel}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1" onClick={() => inputRef.current?.click()}>
            <Upload size={16} className="mr-2" /> Trocar imagem
          </Button>
          {saved && (
            <Button variant="outline" onClick={handleReset} disabled={reset.isPending}>
              {reset.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <RotateCcw size={16} />
              )}
              <span className="ml-2 sm:hidden">Restaurar padrão</span>
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        <ImageCropDialog
          open={cropOpen}
          onOpenChange={setCropOpen}
          src={cropSrc}
          aspect={aspect}
          transparent={transparent}
          onConfirm={handleConfirm}
        />
      </CardContent>
    </Card>
  );
};
