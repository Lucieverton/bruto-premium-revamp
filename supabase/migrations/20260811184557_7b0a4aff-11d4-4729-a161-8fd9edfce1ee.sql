-- =========================================================
-- 1. FUNCTION EXECUTE HARDENING
-- =========================================================
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;

-- Public (anonymous) queue surface
GRANT EXECUTE ON FUNCTION public.get_public_queue() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_barbers() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_services_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_position(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_item_services(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_item_services_summary(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_ticket_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_queue(text, text, uuid[], uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_queue_group(text, text, uuid[], uuid, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leave_queue(uuid) TO anon, authenticated;

-- Staff-only surface (requires a signed-in session; each function also re-checks the role)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_walkin_client(text, text, uuid[], uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_walkin_client(text, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barber_add_client_direct(text, text, uuid[], uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barber_add_client_direct(text, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barber_call_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barber_start_service(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barber_complete_service(uuid, numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barber_set_availability(uuid, text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_barber_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_barber_status(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_barber_status_on_auth(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_queue_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_queue_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_queue_client(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_service_to_queue_item(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_service_from_queue_item(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_with_services(timestamptz, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_barber_breaks(timestamptz, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_barber_queue(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_series(timestamptz, timestamptz, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_by_barber(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_tickets() TO authenticated;

-- =========================================================
-- 2. POLICIES: stop evaluating staff rules for anonymous role
-- =========================================================
DROP POLICY IF EXISTS "Admins can view entry logs" ON public.queue_entry_log;
CREATE POLICY "Admins can view entry logs" ON public.queue_entry_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Barbers can call waiting clients" ON public.queue_items;
CREATE POLICY "Barbers can call waiting clients" ON public.queue_items
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'barber'::app_role) AND status = 'waiting')
  WITH CHECK (has_role(auth.uid(), 'barber'::app_role) AND status = ANY (ARRAY['waiting','called']));

DROP POLICY IF EXISTS "Barbers can update called or in_progress items" ON public.queue_items;
CREATE POLICY "Barbers can update called or in_progress items" ON public.queue_items
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'barber'::app_role) AND status = ANY (ARRAY['called','in_progress']))
  WITH CHECK (has_role(auth.uid(), 'barber'::app_role) AND status = ANY (ARRAY['called','in_progress']));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Staff can view queue item services" ON public.queue_item_services;
CREATE POLICY "Staff can view queue item services" ON public.queue_item_services
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'barber'::app_role));

DROP POLICY IF EXISTS "Admins can manage queue item services" ON public.queue_item_services;
CREATE POLICY "Admins can manage queue item services" ON public.queue_item_services
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage attendance services" ON public.attendance_record_services;
CREATE POLICY "Admins can manage attendance services" ON public.attendance_record_services
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all requests" ON public.queue_requests;
CREATE POLICY "Admins can manage all requests" ON public.queue_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Barbers can create requests" ON public.queue_requests;
CREATE POLICY "Barbers can create requests" ON public.queue_requests
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'barber'::app_role)
    AND requested_by IN (SELECT id FROM public.barbers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Barbers can view own requests" ON public.queue_requests;
CREATE POLICY "Barbers can view own requests" ON public.queue_requests
  FOR SELECT TO authenticated
  USING (requested_by IN (SELECT id FROM public.barbers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all transfers" ON public.queue_transfers;
CREATE POLICY "Admins can view all transfers" ON public.queue_transfers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Barbers can create transfers" ON public.queue_transfers;
CREATE POLICY "Barbers can create transfers" ON public.queue_transfers
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'barber'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Barbers can view own transfers" ON public.queue_transfers;
CREATE POLICY "Barbers can view own transfers" ON public.queue_transfers
  FOR SELECT TO authenticated
  USING (
    from_barber_id IN (SELECT id FROM public.barbers WHERE user_id = auth.uid())
    OR to_barber_id IN (SELECT id FROM public.barbers WHERE user_id = auth.uid())
  );

-- Public gallery read no longer needs has_role for anonymous visitors
DROP POLICY IF EXISTS "site_gallery_public_read" ON public.site_gallery_items;
CREATE POLICY "site_gallery_public_read" ON public.site_gallery_items
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "site_gallery_staff_read" ON public.site_gallery_items
  FOR SELECT TO authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 3. TABLE GRANTS: remove blanket anon access to PII tables
-- =========================================================
REVOKE ALL ON public.queue_items FROM anon;
REVOKE ALL ON public.queue_items FROM authenticated;
GRANT SELECT, UPDATE, DELETE ON public.queue_items TO authenticated;
GRANT ALL ON public.queue_items TO service_role;

REVOKE ALL ON public.queue_entry_log FROM anon;
REVOKE ALL ON public.queue_entry_log FROM authenticated;
GRANT SELECT ON public.queue_entry_log TO authenticated;
GRANT ALL ON public.queue_entry_log TO service_role;

REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- =========================================================
-- 4. DEFENSE IN DEPTH: no automatic admin role assignment
-- =========================================================
CREATE OR REPLACE FUNCTION public.prevent_admin_self_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'::app_role THEN
    -- Only an existing admin may create another admin.
    -- Bootstrapping stays possible while no admin exists yet.
    IF NOT public.has_role(auth.uid(), 'admin'::app_role)
       AND EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role) THEN
      RAISE EXCEPTION 'Apenas administradores podem conceder o papel de administrador';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_admin_self_assignment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_admin_self_assignment ON public.user_roles;
CREATE TRIGGER trg_prevent_admin_self_assignment
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_assignment();

-- =========================================================
-- 5. STORAGE: public read only for genuinely public folders
-- =========================================================
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = 'site'
      OR (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    )
  );

DROP POLICY IF EXISTS "Barbers can upload own avatar" ON storage.objects;
CREATE POLICY "Barbers can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.user_id = auth.uid()
        AND barbers.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Barbers can update own avatar" ON storage.objects;
CREATE POLICY "Barbers can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.user_id = auth.uid()
        AND barbers.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Barbers can delete own avatar" ON storage.objects;
CREATE POLICY "Barbers can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.user_id = auth.uid()
        AND barbers.id::text = (storage.foldername(name))[1]
    )
  );