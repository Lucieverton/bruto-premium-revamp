import { useRef, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { ImageCropDialog } from './ImageCropDialog';
import {
  uploadSiteImage,
  useSiteGallery,
  useSaveGalleryItem,
  useDeleteGalleryItem,
  useReorderGalleryItem,
  type GalleryItem,
} from '@/hooks/useSiteImages';

interface GalleryManagerProps {
  gallery: 'portfolio' | 'produtos';
  title: string;
  description: string;
  aspect: number;
  aspectLabel: string;
  withText?: boolean;
}

export const GalleryManager = ({
  gallery,
  title,
  description,
  aspect,
  aspectLabel,
  withText = false,
}: GalleryManagerProps) => {
  const { data: items = [], isLoading } = useSiteGallery(gallery, false);
  const save = useSaveGalleryItem();
  const remove = useDeleteGalleryItem();
  const reorder = useReorderGalleryItem();
  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      const url = await uploadSiteImage(blob, gallery);
      await save.mutateAsync({
        gallery,
        url,
        sort_order: items.length,
        is_active: true,
      });
      toast({ title: 'Imagem adicionada!' });
    } catch (err) {
      toast({ title: 'Erro ao enviar', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    await reorder.mutateAsync([
      { id: items[index].id, sort_order: target },
      { id: items[target].id, sort_order: index },
    ]);
  };

  const toggleActive = async (item: GalleryItem) => {
    await save.mutateAsync({ ...item, is_active: !item.is_active });
  };

  const saveText = async () => {
    if (!editing) return;
    await save.mutateAsync(editing);
    setEditing(null);
    toast({ title: 'Informações salvas!' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-display text-xl uppercase">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">Proporção recomendada: {aspectLabel}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
          Adicionar foto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Nenhuma foto salva ainda. As fotos padrão continuam sendo exibidas no site.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item, index) => (
            <Card key={item.id} className={item.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-3 space-y-2">
                <img
                  src={item.url}
                  alt={item.title || 'Foto'}
                  className="w-full aspect-square object-cover rounded-md"
                  loading="lazy"
                />
                {withText && (
                  <div className="text-sm">
                    <p className="font-semibold break-words">{item.title || 'Sem título'}</p>
                    <p className="text-xs text-muted-foreground break-words">{item.description}</p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                    <span className="text-xs text-muted-foreground">
                      {item.is_active ? 'Exibindo' : 'Oculta'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(item)}>
                      <Pencil size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        src={cropSrc}
        aspect={aspect}
        onConfirm={handleConfirm}
      />

      <AlertDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Informações da foto</AlertDialogTitle>
            <AlertDialogDescription>
              Usadas como texto alternativo e, nos produtos, como nome e descrição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input
                value={editing?.title || ''}
                onChange={(e) => setEditing((p) => (p ? { ...p, title: e.target.value } : p))}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editing?.description || ''}
                onChange={(e) => setEditing((p) => (p ? { ...p, description: e.target.value } : p))}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={saveText}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela deixará de aparecer no site. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) await remove.mutateAsync(deleteId);
                setDeleteId(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
