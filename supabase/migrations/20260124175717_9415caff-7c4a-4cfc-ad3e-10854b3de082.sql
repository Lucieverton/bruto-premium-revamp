-- 1. Habilitar Realtime para tabela barbers
ALTER PUBLICATION supabase_realtime ADD TABLE public.barbers;

-- 2. Atualizar RPC join_queue para verificar ticket ativo em vez de limite diário
CREATE OR REPLACE FUNCTION public.join_queue(p_customer_name text, p_customer_phone text, p_service_id uuid DEFAULT NULL::uuid, p_barber_id uuid DEFAULT NULL::uuid, p_priority text DEFAULT 'normal'::text)
 RETURNS TABLE(id uuid, ticket_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_phone_normalized TEXT;
  v_active_ticket INTEGER;
BEGIN
  -- Normalize phone (digits only)
  v_phone_normalized := regexp_replace(p_customer_phone, '[^0-9]', '', 'g');
  
  -- Validations
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF length(v_phone_normalized) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;
  
  -- CHECK IF CUSTOMER ALREADY HAS AN ACTIVE TICKET (waiting, called, or in_progress)
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress');
  
  IF v_active_ticket > 0 THEN
    RAISE EXCEPTION 'Você já está na fila. Aguarde seu atendimento ser finalizado.';
  END IF;
  
  -- Validate priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;
  
  -- Insert (trigger generates ticket_number)
  RETURN QUERY
  INSERT INTO queue_items (
    customer_name, 
    customer_phone, 
    service_id, 
    barber_id, 
    priority, 
    origin, 
    status,
    ticket_number
  ) VALUES (
    trim(p_customer_name), 
    v_phone_normalized,
    p_service_id,
    p_barber_id, 
    p_priority, 
    'online', 
    'waiting',
    ''
  )
  RETURNING queue_items.id, queue_items.ticket_number;
END;
$function$;