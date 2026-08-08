CREATE TABLE public.site_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL UNIQUE,
  url text NOT NULL,
  alt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_images_public_read" ON public.site_images FOR SELECT USING (true);
CREATE POLICY "site_images_admin_insert" ON public.site_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_images_admin_update" ON public.site_images FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_images_admin_delete" ON public.site_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.site_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery text NOT NULL CHECK (gallery IN ('portfolio', 'produtos')),
  url text NOT NULL,
  title text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_gallery_items TO authenticated;
GRANT ALL ON public.site_gallery_items TO service_role;

ALTER TABLE public.site_gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_gallery_public_read" ON public.site_gallery_items FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_gallery_admin_insert" ON public.site_gallery_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_gallery_admin_update" ON public.site_gallery_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_gallery_admin_delete" ON public.site_gallery_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_site_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_site_images_updated_at BEFORE UPDATE ON public.site_images
FOR EACH ROW EXECUTE FUNCTION public.set_site_content_updated_at();

CREATE TRIGGER trg_site_gallery_updated_at BEFORE UPDATE ON public.site_gallery_items
FOR EACH ROW EXECUTE FUNCTION public.set_site_content_updated_at();