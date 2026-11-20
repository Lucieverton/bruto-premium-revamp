CREATE OR REPLACE FUNCTION public.restore_barber_after_ticket_end()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_restore text;
BEGIN
  IF NEW.barber_id IS NOT NULL
     AND OLD.status IN ('called','in_progress')
     AND NEW.status IN ('cancelled','no_show','waiting')
     AND NOT EXISTS (SELECT 1 FROM queue_items WHERE barber_id = NEW.barber_id AND id <> NEW.id AND status = 'in_progress') THEN
    SELECT COALESCE(status_before_service,'online') INTO v_restore FROM barbers WHERE id = NEW.barber_id AND status = 'busy';
    IF v_restore IS NOT NULL THEN
      IF v_restore NOT IN ('online','paused','offline') THEN v_restore := 'online'; END IF;
      UPDATE barbers SET status = v_restore, is_available = (v_restore = 'online'),
        status_before_service = NULL, status_changed_at = now()
      WHERE id = NEW.barber_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_restore_barber_after_ticket_end ON public.queue_items;
CREATE TRIGGER trg_restore_barber_after_ticket_end
AFTER UPDATE OF status ON public.queue_items
FOR EACH ROW EXECUTE FUNCTION public.restore_barber_after_ticket_end();

CREATE OR REPLACE FUNCTION public.barber_set_availability(p_barber_id uuid, p_state text, p_reason text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_expected_return timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid; v_is_admin boolean; v_current text;
BEGIN
  IF p_state NOT IN ('available', 'paused', 'offline') THEN
    RAISE EXCEPTION 'Estado inválido. Use: available, paused ou offline';
  END IF;
  SELECT user_id, status INTO v_owner, v_current FROM barbers WHERE id = p_barber_id;
  IF v_current IS NULL THEN RAISE EXCEPTION 'Barbeiro não encontrado'; END IF;
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);
  IF v_owner IS DISTINCT FROM auth.uid() AND NOT v_is_admin THEN RAISE EXCEPTION 'Não autorizado'; END IF;

  IF v_current = 'busy' AND EXISTS (
    SELECT 1 FROM queue_items WHERE barber_id = p_barber_id AND status = 'in_progress'
      AND ((created_at AT TIME ZONE 'America/Fortaleza')::date) = ((now() AT TIME ZONE 'America/Fortaleza')::date)
  ) THEN
    RAISE EXCEPTION 'Finalize o atendimento atual antes de alterar sua disponibilidade';
  END IF;

  UPDATE barber_breaks SET ended_at = now(), ended_by = auth.uid()
  WHERE barber_id = p_barber_id AND ended_at IS NULL;

  IF p_state = 'available' THEN
    UPDATE barbers SET status = 'online', is_available = true, status_before_service = NULL,
      pause_reason = NULL, pause_note = NULL, pause_expected_return = NULL, status_changed_at = now()
    WHERE id = p_barber_id;
  ELSE
    UPDATE barbers SET
      status = CASE WHEN p_state = 'paused' THEN 'paused' ELSE 'offline' END,
      is_available = false, status_before_service = NULL,
      pause_reason = COALESCE(NULLIF(trim(COALESCE(p_reason, '')), ''), CASE WHEN p_state = 'paused' THEN 'outro' ELSE 'expediente_encerrado' END),
      pause_note = NULLIF(trim(COALESCE(p_note, '')), ''),
      pause_expected_return = p_expected_return, status_changed_at = now()
    WHERE id = p_barber_id;
    INSERT INTO barber_breaks (barber_id, reason, note, state, expected_return)
    VALUES (p_barber_id,
      COALESCE(NULLIF(trim(COALESCE(p_reason, '')), ''), CASE WHEN p_state = 'paused' THEN 'outro' ELSE 'expediente_encerrado' END),
      NULLIF(trim(COALESCE(p_note, '')), ''), p_state, p_expected_return);
  END IF;
  RETURN true;
END;
$function$;