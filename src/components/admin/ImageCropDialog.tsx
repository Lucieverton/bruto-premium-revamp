import { useCallback, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  aspect?: number;
  /** Keep transparency (PNG output) — useful for logos and icons */
  transparent?: boolean;
  maxWidth?: number;
  onConfirm: (blob: Blob) => Promise<void> | void;
}

const buildCrop = (width: number, height: number, aspect?: number): Crop => {
  if (!aspect) return { unit: '%', x: 5, y: 5, width: 90, height: 90 };
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
    width,
    height,
  );
};

export const ImageCropDialog = ({
  open,
  onOpenChange,
  src,
  aspect,
  transparent = false,
  maxWidth = 1600,
  onConfirm,
}: ImageCropDialogProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [freeAspect, setFreeAspect] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeAspect = freeAspect ? undefined : aspect;

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(buildCrop(width, height, activeAspect));
    },
    [activeAspect],
  );

  const handleConfirm = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop || completedCrop.width === 0) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    let outW = Math.round(completedCrop.width * scaleX);
    let outH = Math.round(completedCrop.height * scaleY);
    if (outW > maxWidth) {
      outH = Math.round((outH * maxWidth) / outW);
      outW = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outW,
      outH,
    );

    const type = transparent ? 'image/png' : 'image/webp';
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), type, 0.9),
    );
    if (!blob) return;

    setSaving(true);
    try {
      await onConfirm(blob);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recortar imagem</DialogTitle>
          <DialogDescription>
            Ajuste o enquadramento antes de salvar. Arraste as bordas para escolher a área.
          </DialogDescription>
        </DialogHeader>

        {src && (
          <div className="flex justify-center bg-muted/40 rounded-md p-2">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={activeAspect}
              keepSelection
            >
              <img
                ref={imgRef}
                src={src}
                alt="Imagem para recorte"
                onLoad={onImageLoad}
                className="max-h-[45vh] w-auto"
              />
            </ReactCrop>
          </div>
        )}

        {aspect && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFreeAspect((v) => !v);
              const image = imgRef.current;
              if (image) setCrop(buildCrop(image.width, image.height, freeAspect ? aspect : undefined));
            }}
          >
            {freeAspect ? 'Usar proporção recomendada' : 'Recorte livre'}
          </Button>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !completedCrop}>
            {saving && <Loader2 className="animate-spin mr-2" size={16} />}
            Salvar imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
