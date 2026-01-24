import { useRef, useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  barberId: string;
  avatarUrl: string | null;
  displayName: string;
  onUploadSuccess: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
};

export const AvatarUpload = ({
  barberId,
  avatarUrl,
  displayName,
  onUploadSuccess,
  size = 'md',
}: AvatarUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie uma imagem JPG, PNG ou WebP.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${barberId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache bust

      // Update barber record
      const { error: updateError } = await supabase
        .from('barbers')
        .update({ avatar_url: publicUrl })
        .eq('id', barberId);

      if (updateError) throw updateError;

      onUploadSuccess(publicUrl);

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro ao enviar foto',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Escolher foto de perfil"
      />
      
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center relative transition-all',
          sizeMap[size],
          'bg-primary/20 border-2 border-primary/30 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background'
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Foto de ${displayName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity',
          isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          {isUploading ? (
            <Loader2 className="text-white animate-spin" size={size === 'lg' ? 28 : 20} />
          ) : (
            <Camera className="text-white" size={size === 'lg' ? 28 : 20} />
          )}
        </div>
      </button>

      {size === 'lg' && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Clique para alterar
        </p>
      )}
    </div>
  );
};
