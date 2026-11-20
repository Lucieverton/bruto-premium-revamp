DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view queue settings" ON public.queue_settings;
CREATE POLICY "Staff can view queue settings" ON public.queue_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'barber'::app_role));

CREATE OR REPLACE FUNCTION public.get_queue_settings_public()
RETURNS TABLE(id uuid, is_active boolean, max_queue_size integer, opening_time text, closing_time text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, is_active, max_queue_size, opening_time, closing_time, updated_at
  FROM public.queue_settings ORDER BY updated_at DESC LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_queue_settings_public() TO anon, authenticated;