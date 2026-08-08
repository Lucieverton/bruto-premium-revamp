-- 1. Novas colunas em barbers
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS pause_note text,
  ADD COLUMN IF NOT EXISTS pause_expected_return timestamptz,
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status_before_service text;

-- 2. Histórico de pausas
CREATE TABLE IF NOT EXISTS public.barber_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'outro',
  note text,
  state text NOT NULL DEFAULT 'paused',
  expected_return timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  ended_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.barber_breaks TO authenticated;
GRANT ALL ON public.barber_breaks TO service_role;

ALTER TABLE public.barber_breaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage barber breaks" ON public.barber_breaks;
CREATE POLICY "Admins can manage barber breaks"
ON public.barber_breaks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Barbers can view own breaks" ON public.barber_breaks;
CREATE POLICY "Barbers can view own breaks"
ON public.barber_breaks FOR SELECT TO authenticated
USING (barber_id IN (SELECT id FROM public.barbers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Barbers can insert own breaks" ON public.barber_breaks;
CREATE POLICY "Barbers can insert own breaks"
ON public.barber_breaks FOR INSERT TO authenticated
WITH CHECK (barber_id IN (SELECT id FROM public.barbers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Barbers can update own breaks" ON public.barber_breaks;
CREATE POLICY "Barbers can update own breaks"
ON public.barber_breaks FOR UPDATE TO authenticated
USING (barber_id IN (SELECT id FROM public.barbers WHERE user_id = auth.uid()))
WITH CHECK (barber_id IN (SELECT id FROM public.barbers WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_barber_breaks_barber_started
  ON public.barber_breaks (barber_id, started_at DESC);

CREATE OR REPLACE FUNCTION public.set_barber_breaks_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_barber_breaks_updated_at ON public.barber_breaks;
CREATE TRIGGER trg_barber_breaks_updated_at
BEFORE UPDATE ON public.barber_breaks
FOR EACH ROW EXECUTE FUNCTION public.set_barber_breaks_updated_at();

-- 3. RPC central de disponibilidade
CREATE OR REPLACE FUNCTION public.barber_set_availability(
  p_barber_id uuid,
  p_state text,
  p_reason text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_expected_return timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_is_admin boolean;
  v_current text;
BEGIN
  IF p_state NOT IN ('available', 'paused', 'offline') THEN
    RAISE EXCEPTION 'Estado inválido. Use: available, paused ou offline';
  END IF;

  SELECT user_id, status INTO v_owner, v_current FROM barbers WHERE id = p_barber_id;
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Barbeiro não encontrado';
  END IF;

  v_is_admin := has_role(auth.uid(), 'admin'::app_role);
  IF v_owner IS DISTINCT FROM auth.uid() AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF v_current = 'busy' THEN
    RAISE EXCEPTION 'Finalize o atendimento atual antes de alterar sua disponibilidade';
  END IF;

  -- Encerra pausa aberta ao sair de paused/offline
  UPDATE barber_breaks
  SET ended_at = now(), ended_by = auth.uid()
  WHERE barber_id = p_barber_id AND ended_at IS NULL;

  IF p_state = 'available' THEN
    UPDATE barbers SET
      status = 'online', is_available = true,
      pause_reason = NULL, pause_note = NULL, pause_expected_return = NULL,
      status_changed_at = now()
    WHERE id = p_barber_id;
  ELSE
    UPDATE barbers SET
      status = CASE WHEN p_state = 'paused' THEN 'paused' ELSE 'offline' END,
      is_available = false,
      pause_reason = COALESCE(NULLIF(trim(COALESCE(p_reason, '')), ''), CASE WHEN p_state = 'paused' THEN 'outro' ELSE 'expediente_encerrado' END),
      pause_note = NULLIF(trim(COALESCE(p_note, '')), ''),
      pause_expected_return = p_expected_return,
      status_changed_at = now()
    WHERE id = p_barber_id;

    INSERT INTO barber_breaks (barber_id, reason, note, state, expected_return)
    VALUES (
      p_barber_id,
      COALESCE(NULLIF(trim(COALESCE(p_reason, '')), ''), CASE WHEN p_state = 'paused' THEN 'outro' ELSE 'expediente_encerrado' END),
      NULLIF(trim(COALESCE(p_note, '')), ''),
      p_state,
      p_expected_return
    );
  END IF;

  RETURN true;
END;
$$;

-- 4. Admin força retorno
CREATE OR REPLACE FUNCTION public.admin_force_barber_status(p_barber_id uuid, p_state text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem forçar o status';
  END IF;

  PERFORM barber_set_availability(p_barber_id, p_state, 'forcado_admin', NULL, NULL);

  INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'force_barber_status', 'barber', p_barber_id::text,
          jsonb_build_object('state', p_state));

  RETURN true;
END;
$$;

-- 5. Não reativar automaticamente no login
CREATE OR REPLACE FUNCTION public.update_barber_status_on_auth(p_user_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Desativado: o status do barbeiro é controlado exclusivamente pelo painel.
  RETURN true;
END;
$$;

-- 6. Guardar estado anterior ao iniciar atendimento
CREATE OR REPLACE FUNCTION public.barber_start_service(p_ticket_id uuid, p_barber_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_ticket_status TEXT;
  v_current_status TEXT;
BEGIN
  SELECT user_id, status INTO v_user_id, v_current_status FROM barbers WHERE id = p_barber_id;

  IF v_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  SELECT status INTO v_ticket_status FROM queue_items WHERE id = p_ticket_id;

  IF v_ticket_status NOT IN ('waiting', 'called') THEN
    RAISE EXCEPTION 'Este cliente não pode ser atendido (status: %)', v_ticket_status;
  END IF;

  UPDATE queue_items
  SET status = 'in_progress', barber_id = p_barber_id,
      is_called = true, called_at = COALESCE(called_at, now())
  WHERE id = p_ticket_id;

  UPDATE barbers
  SET status = 'busy',
      is_available = false,
      status_before_service = CASE WHEN v_current_status = 'busy' THEN status_before_service ELSE v_current_status END,
      status_changed_at = now()
  WHERE id = p_barber_id;

  RETURN TRUE;
END;
$$;

-- 7. Restaurar estado escolhido ao finalizar
CREATE OR REPLACE FUNCTION public.barber_complete_service(p_ticket_id uuid, p_price_charged numeric, p_payment_method text DEFAULT NULL::text, p_services jsonb DEFAULT NULL::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barber_user_id UUID;
  v_queue_item RECORD;
  v_attendance_id UUID;
  v_service RECORD;
  v_restore TEXT;
BEGIN
  SELECT * INTO v_queue_item FROM queue_items WHERE id = p_ticket_id;

  IF v_queue_item IS NULL THEN
    RAISE EXCEPTION 'Ticket não encontrado';
  END IF;

  IF v_queue_item.status != 'in_progress' THEN
    RAISE EXCEPTION 'Este atendimento não está em andamento';
  END IF;

  SELECT user_id INTO v_barber_user_id FROM barbers WHERE id = v_queue_item.barber_id;

  IF v_barber_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE queue_items
  SET status = 'completed', completed_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO attendance_records (
    queue_item_id, barber_id, service_id, customer_name, price_charged, payment_method, group_id, companion_name
  ) VALUES (
    p_ticket_id, v_queue_item.barber_id, v_queue_item.service_id,
    v_queue_item.customer_name, p_price_charged, p_payment_method,
    v_queue_item.group_id, v_queue_item.companion_name
  )
  RETURNING id INTO v_attendance_id;

  IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_to_recordset(p_services)
      AS x(service_id uuid, service_name text, price_charged numeric)
    LOOP
      INSERT INTO attendance_record_services (attendance_record_id, service_id, service_name, price_charged)
      VALUES (v_attendance_id, v_service.service_id, v_service.service_name, v_service.price_charged);
    END LOOP;
  ELSE
    INSERT INTO attendance_record_services (attendance_record_id, service_id, service_name, price_charged)
    SELECT v_attendance_id, qis.service_id, s.name, qis.price_at_time
    FROM queue_item_services qis
    JOIN services s ON s.id = qis.service_id
    WHERE qis.queue_item_id = p_ticket_id;
  END IF;

  -- Restaura o estado escolhido pelo barbeiro antes do atendimento
  SELECT COALESCE(status_before_service, 'online') INTO v_restore
  FROM barbers WHERE id = v_queue_item.barber_id;

  IF v_restore NOT IN ('online', 'paused', 'offline') THEN
    v_restore := 'online';
  END IF;

  UPDATE barbers
  SET status = v_restore,
      is_available = (v_restore = 'online'),
      status_before_service = NULL,
      status_changed_at = now()
  WHERE id = v_queue_item.barber_id;

  RETURN TRUE;
END;
$$;

-- 8. Barbeiros públicos com dados de pausa
DROP FUNCTION IF EXISTS public.get_public_barbers();
CREATE OR REPLACE FUNCTION public.get_public_barbers()
RETURNS TABLE(
  id uuid, display_name text, status text, specialty text,
  is_available boolean, avatar_url text,
  pause_reason text, pause_expected_return timestamptz, status_changed_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, status, specialty, is_available, avatar_url,
         pause_reason, pause_expected_return, status_changed_at
  FROM public.barbers
  WHERE is_active = true;
$$;

-- 9. Histórico de pausas para o painel do dono
CREATE OR REPLACE FUNCTION public.get_barber_breaks(
  p_start timestamptz,
  p_end timestamptz,
  p_barber_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid, barber_id uuid, barber_name text, reason text, note text,
  state text, expected_return timestamptz, started_at timestamptz,
  ended_at timestamptz, duration_minutes integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bb.id, bb.barber_id, b.display_name, bb.reason, bb.note,
         bb.state, bb.expected_return, bb.started_at, bb.ended_at,
         (EXTRACT(EPOCH FROM (COALESCE(bb.ended_at, now()) - bb.started_at)) / 60)::integer
  FROM barber_breaks bb
  JOIN barbers b ON b.id = bb.barber_id
  WHERE bb.started_at >= p_start
    AND bb.started_at <= p_end
    AND (p_barber_id IS NULL OR bb.barber_id = p_barber_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR bb.barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
    )
  ORDER BY bb.started_at DESC;
$$;