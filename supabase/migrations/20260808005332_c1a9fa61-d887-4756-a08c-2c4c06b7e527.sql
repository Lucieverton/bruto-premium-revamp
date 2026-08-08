CREATE TABLE public.site_texts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_texts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_texts TO authenticated;
GRANT ALL ON public.site_texts TO service_role;

ALTER TABLE public.site_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site texts" ON public.site_texts FOR SELECT USING (true);
CREATE POLICY "Admins can insert site texts" ON public.site_texts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update site texts" ON public.site_texts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete site texts" ON public.site_texts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_texts_updated_at
BEFORE UPDATE ON public.site_texts
FOR EACH ROW EXECUTE FUNCTION public.set_site_content_updated_at();