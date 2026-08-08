import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SiteImageSlot =
  | 'logo'
  | 'menu_icon'
  | 'close_icon'
  | 'hero_desktop'
  | 'hero_mobile'
  | 'about_front'
  | 'about_interior'
  | 'queue_chair';

export interface SiteImage {
  id: string;
  slot: string;
  url: string;
  alt: string | null;
}

export interface GalleryItem {
  id: string;
  gallery: string;
  url: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

const STORAGE_BUCKET = 'avatars';
const STORAGE_PREFIX = 'site';

export const useSiteImages = () => {
  return useQuery({
    queryKey: ['site-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_images')
        .select('id, slot, url, alt');
      if (error) throw error;
      const map: Record<string, SiteImage> = {};
      (data || []).forEach((row) => {
        map[row.slot] = row as SiteImage;
      });
      return map;
    },
    staleTime: 60_000,
  });
};

/** Returns the saved image for a slot, or the bundled fallback while none is saved. */
export const useSiteImage = (slot: SiteImageSlot, fallback: string) => {
  const { data } = useSiteImages();
  return data?.[slot]?.url || fallback;
};

export const useSiteGallery = (gallery: 'portfolio' | 'produtos', onlyActive = true) => {
  return useQuery({
    queryKey: ['site-gallery', gallery, onlyActive],
    queryFn: async () => {
      let query = supabase
        .from('site_gallery_items')
        .select('id, gallery, url, title, description, sort_order, is_active')
        .eq('gallery', gallery)
        .order('sort_order', { ascending: true });
      if (onlyActive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as GalleryItem[];
    },
    staleTime: 60_000,
  });
};

export const uploadSiteImage = async (blob: Blob, name: string) => {
  const ext = blob.type === 'image/png' ? 'png' : 'webp';
  const path = `${STORAGE_PREFIX}/${name}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const useSaveSiteImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slot, url, alt }: { slot: SiteImageSlot; url: string; alt?: string }) => {
      const { error } = await supabase
        .from('site_images')
        .upsert({ slot, url, alt: alt ?? null }, { onConflict: 'slot' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-images'] }),
  });
};

export const useResetSiteImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slot: SiteImageSlot) => {
      const { error } = await supabase.from('site_images').delete().eq('slot', slot);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-images'] }),
  });
};

export const useSaveGalleryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<GalleryItem> & { gallery: string; url: string }) => {
      if (item.id) {
        const { error } = await supabase
          .from('site_gallery_items')
          .update({
            url: item.url,
            title: item.title ?? null,
            description: item.description ?? null,
            sort_order: item.sort_order ?? 0,
            is_active: item.is_active ?? true,
          })
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_gallery_items').insert({
          gallery: item.gallery,
          url: item.url,
          title: item.title ?? null,
          description: item.description ?? null,
          sort_order: item.sort_order ?? 0,
          is_active: item.is_active ?? true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-gallery'] }),
  });
};

export const useDeleteGalleryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_gallery_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-gallery'] }),
  });
};

export const useReorderGalleryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from('site_gallery_items')
          .update({ sort_order: u.sort_order })
          .eq('id', u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-gallery'] }),
  });
};
