import { useEffect, useState } from 'react';
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
const LS_PREFIX = 'site-content-cache:';

/* ------------------------- local persistent cache ------------------------- */

const readCache = <T,>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
};

const writeCache = (key: string, data: unknown) => {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
  } catch {
    /* quota / private mode - ignore */
  }
};

/** Loads an image off-screen; resolves when it is decoded (or on error). */
export const preloadImage = (url: string) =>
  new Promise<void>((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });

/**
 * Keeps the currently painted URL stable: only swaps to a new URL after the
 * new image is fully loaded, so the old photo never "flashes" into the new one.
 */
const useStableImage = (target: string | undefined) => {
  const [current, setCurrent] = useState<string | undefined>(target);

  useEffect(() => {
    let cancelled = false;
    if (!target) return;
    if (target === current) return;
    if (!current) {
      // nothing painted yet: still preload so the swap is a single clean paint
      preloadImage(target).then(() => {
        if (!cancelled) setCurrent(target);
      });
      return;
    }
    preloadImage(target).then(() => {
      if (!cancelled) setCurrent(target);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return current;
};

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
      writeCache('site-images', map);
      return map;
    },
    initialData: () => readCache<Record<string, SiteImage>>('site-images'),
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/**
 * Resolves a managed image slot.
 * `resolved` is false only while we have neither cache nor server answer —
 * components should render a neutral placeholder instead of the bundled asset.
 */
export const useSiteImageSlot = (slot: SiteImageSlot, fallback: string) => {
  const { data, isFetched, isError } = useSiteImages();
  const hasData = data !== undefined;
  // No row saved for this slot => bundled asset is the intended image.
  const target = hasData ? data?.[slot]?.url || fallback : isError && isFetched ? fallback : undefined;
  const src = useStableImage(target);
  return { src: src || fallback, resolved: Boolean(src) };
};

/** Returns the saved image for a slot, or the bundled fallback while none is saved. */
export const useSiteImage = (slot: SiteImageSlot, fallback: string) => {
  return useSiteImageSlot(slot, fallback).src;
};

export const useSiteGallery = (gallery: 'portfolio' | 'produtos', onlyActive = true) => {
  const cacheKey = `site-gallery:${gallery}:${onlyActive}`;
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
      const items = (data || []) as GalleryItem[];
      await Promise.all(items.map((i) => preloadImage(i.url)));
      writeCache(cacheKey, items);
      return items;
    },
    initialData: () => readCache<GalleryItem[]>(cacheKey),
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/** Extracts the storage object path from a public URL of our bucket. */
const pathFromPublicUrl = (url: string | null | undefined) => {
  if (!url) return null;
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
};

/** Removes an old uploaded file so it can never be served again. */
export const removeSiteImageFile = async (url: string | null | undefined) => {
  const path = pathFromPublicUrl(url);
  if (!path || !path.startsWith(`${STORAGE_PREFIX}/`)) return;
  try {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch {
    /* best-effort cleanup */
  }
};

export const uploadSiteImage = async (blob: Blob, name: string) => {
  const ext = blob.type === 'image/png' ? 'png' : 'webp';
  const path = `${STORAGE_PREFIX}/${name}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  await preloadImage(data.publicUrl);
  return data.publicUrl;
};


export const useSaveSiteImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slot, url, alt }: { slot: SiteImageSlot; url: string; alt?: string }) => {
      const previous = queryClient.getQueryData<Record<string, SiteImage>>(['site-images'])?.[slot]?.url;
      const { error } = await supabase
        .from('site_images')
        .upsert({ slot, url, alt: alt ?? null }, { onConflict: 'slot' });
      if (error) throw error;
      if (previous && previous !== url) await removeSiteImageFile(previous);
    },
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['site-images'] }),
  });
};

export const useResetSiteImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slot: SiteImageSlot) => {
      const previous = queryClient.getQueryData<Record<string, SiteImage>>(['site-images'])?.[slot]?.url;
      const { error } = await supabase.from('site_images').delete().eq('slot', slot);
      if (error) throw error;
      await removeSiteImageFile(previous);
    },
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['site-images'] }),
  });
};

export const useSaveGalleryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<GalleryItem> & { gallery: string; url: string }) => {
      if (item.id) {
        const { data: prev } = await supabase
          .from('site_gallery_items')
          .select('url')
          .eq('id', item.id)
          .maybeSingle();
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
        if (prev?.url && prev.url !== item.url) await removeSiteImageFile(prev.url);
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
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['site-gallery'] }),
  });
};

export const useDeleteGalleryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: prev } = await supabase
        .from('site_gallery_items')
        .select('url')
        .eq('id', id)
        .maybeSingle();
      const { error } = await supabase.from('site_gallery_items').delete().eq('id', id);
      if (error) throw error;
      await removeSiteImageFile(prev?.url);
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

/* ---------------------------- Site texts ---------------------------- */

export const useSiteTexts = () => {
  return useQuery({
    queryKey: ['site-texts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_texts').select('key, value');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value;
      });
      writeCache('site-texts', map);
      return map;
    },
    initialData: () => readCache<Record<string, string>>('site-texts'),
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60_000,

    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/** Returns the saved text for a key, or the provided fallback. */
export const useSiteText = (key: string, fallback = '') => {
  const { data } = useSiteTexts();
  const value = data?.[key];
  return value && value.trim().length > 0 ? value : fallback;
};

export const useSaveSiteTexts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Record<string, string>) => {
      const rows = Object.entries(entries).map(([key, value]) => ({ key, value: value ?? '' }));
      if (rows.length === 0) return;
      const { error } = await supabase.from('site_texts').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-texts'] }),
  });
};
