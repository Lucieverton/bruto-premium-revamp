-- Fase 4: Primeiro atualizar registros existentes com 'cartao' para 'debito' (padrão)
UPDATE attendance_records SET payment_method = 'debito' WHERE payment_method = 'cartao';

-- Agora podemos adicionar a nova constraint
ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_payment_method_check;

ALTER TABLE attendance_records 
ADD CONSTRAINT attendance_records_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN ('dinheiro', 'pix', 'debito', 'credito', 'pendente'));

-- Fase 6: Adicionar status 'busy' para barbeiros em atendimento
ALTER TABLE barbers DROP CONSTRAINT IF EXISTS barbers_status_check;

ALTER TABLE barbers ADD CONSTRAINT barbers_status_check 
CHECK (status IN ('online', 'away', 'offline', 'busy'));

-- Atualizar função barber_start_service para usar status 'busy'
CREATE OR REPLACE FUNCTION public.barber_start_service(p_ticket_id uuid, p_barber_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_ticket_status TEXT;
BEGIN
  SELECT user_id INTO v_user_id FROM barbers WHERE id = p_barber_id;
  
  IF v_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  SELECT status INTO v_ticket_status FROM queue_items WHERE id = p_ticket_id;
  
  IF v_ticket_status NOT IN ('waiting', 'called') THEN
    RAISE EXCEPTION 'Este cliente não pode ser atendido (status: %)', v_ticket_status;
  END IF;
  
  UPDATE queue_items 
  SET 
    status = 'in_progress',
    barber_id = p_barber_id,
    is_called = true,
    called_at = COALESCE(called_at, now())
  WHERE id = p_ticket_id;
  
  UPDATE barbers 
  SET status = 'busy', is_available = false
  WHERE id = p_barber_id;
  
  RETURN TRUE;
END;
$function$;

-- Atualizar função barber_complete_service
CREATE OR REPLACE FUNCTION public.barber_complete_service(p_ticket_id uuid, p_price_charged numeric, p_payment_method text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_barber_id UUID;
  v_barber_user_id UUID;
  v_queue_item RECORD;
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
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = p_ticket_id;
  
  INSERT INTO attendance_records (
    queue_item_id, barber_id, service_id, customer_name, price_charged, payment_method
  ) VALUES (
    p_ticket_id, v_queue_item.barber_id, v_queue_item.service_id, 
    v_queue_item.customer_name, p_price_charged, p_payment_method
  );
  
  UPDATE barbers 
  SET status = 'online', is_available = true
  WHERE id = v_queue_item.barber_id;
  
  RETURN TRUE;
END;
$function$;

-- Função para atualizar status no login/logout
CREATE OR REPLACE FUNCTION public.update_barber_status_on_auth(p_user_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_status NOT IN ('online', 'away', 'offline', 'busy') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;
  
  UPDATE barbers 
  SET 
    status = p_status,
    is_available = CASE WHEN p_status = 'online' THEN true ELSE false END
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$function$;

-- Atualizar get_public_barbers para incluir status 'busy'
CREATE OR REPLACE FUNCTION public.get_public_barbers()
RETURNS TABLE(id uuid, display_name text, status text, specialty text, is_available boolean, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    id,
    display_name,
    status,
    specialty,
    is_available,
    avatar_url
  FROM public.barbers
  WHERE is_active = true;
$function$;