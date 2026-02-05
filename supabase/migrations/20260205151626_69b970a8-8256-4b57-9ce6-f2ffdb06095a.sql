-- Atualizar join_queue com nova lógica:
-- - Limite de 10 entradas por telefone por dia (contando apenas tickets finalizados)
-- - Pode entrar/sair livremente, só conta quando é ATENDIDO

CREATE OR REPLACE FUNCTION public.join_queue(
  p_customer_name text, 
  p_customer_phone text, 
  p_service_ids uuid[] DEFAULT NULL::uuid[], 
  p_barber_id uuid DEFAULT NULL::uuid, 
  p_priority text DEFAULT 'normal'::text
)
RETURNS TABLE(id uuid, ticket_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone_normalized TEXT;
  v_active_ticket INTEGER;
  v_completed_today INTEGER;
  v_queue_id UUID;
  v_ticket_number TEXT;
  v_service_id UUID;
  v_service_price NUMERIC;
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
  
  -- CHECK IF CUSTOMER ALREADY HAS AN ACTIVE TICKET TODAY
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress')
  AND created_at::date = CURRENT_DATE;
  
  IF v_active_ticket > 0 THEN
    RAISE EXCEPTION 'Você já está na fila de hoje. Aguarde seu atendimento.';
  END IF;
  
  -- CHECK DAILY LIMIT: 10 completed attendances per day
  SELECT COUNT(*) INTO v_completed_today
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status = 'completed'
  AND created_at::date = CURRENT_DATE;
  
  IF v_completed_today >= 10 THEN
    RAISE EXCEPTION 'Você atingiu o limite de 10 atendimentos hoje. Volte amanhã!';
  END IF;
  
  -- Validate priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;
  
  -- Insert queue item (service_id stores first service for backward compatibility)
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
    CASE WHEN p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN p_service_ids[1] ELSE NULL END,
    p_barber_id, 
    p_priority, 
    'online', 
    'waiting',
    ''
  )
  RETURNING queue_items.id, queue_items.ticket_number INTO v_queue_id, v_ticket_number;
  
  -- Insert all services into junction table
  IF p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN
    FOREACH v_service_id IN ARRAY p_service_ids
    LOOP
      SELECT price INTO v_service_price FROM services WHERE services.id = v_service_id;
      IF v_service_price IS NOT NULL THEN
        INSERT INTO queue_item_services (queue_item_id, service_id, price_at_time)
        VALUES (v_queue_id, v_service_id, v_service_price);
      END IF;
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT v_queue_id, v_ticket_number;
END;
$$;

-- Atualizar add_walkin_client com mesma lógica
CREATE OR REPLACE FUNCTION public.add_walkin_client(
  p_customer_name text, 
  p_customer_phone text, 
  p_service_ids uuid[] DEFAULT NULL::uuid[], 
  p_barber_id uuid DEFAULT NULL::uuid, 
  p_priority text DEFAULT 'normal'::text
)
RETURNS TABLE(id uuid, ticket_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone_normalized TEXT;
  v_active_ticket INTEGER;
  v_completed_today INTEGER;
  v_queue_id UUID;
  v_ticket_number TEXT;
  v_service_id UUID;
  v_service_price NUMERIC;
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem adicionar clientes presenciais';
  END IF;

  -- Normalize phone
  v_phone_normalized := regexp_replace(p_customer_phone, '[^0-9]', '', 'g');

  -- Validações
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF length(v_phone_normalized) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;
  
  -- Check for active ticket
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress')
  AND created_at::date = CURRENT_DATE;
  
  IF v_active_ticket > 0 THEN
    RAISE EXCEPTION 'Este cliente já está na fila de hoje.';
  END IF;
  
  -- Check daily limit (completed only)
  SELECT COUNT(*) INTO v_completed_today
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status = 'completed'
  AND created_at::date = CURRENT_DATE;
  
  IF v_completed_today >= 10 THEN
    RAISE EXCEPTION 'Este cliente atingiu o limite de 10 atendimentos hoje.';
  END IF;
  
  -- Validar priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;
  
  -- Insert queue item
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
    CASE WHEN p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN p_service_ids[1] ELSE NULL END,
    p_barber_id, 
    p_priority, 
    'presencial', 
    'waiting',
    ''
  )
  RETURNING queue_items.id, queue_items.ticket_number INTO v_queue_id, v_ticket_number;
  
  -- Insert all services into junction table
  IF p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN
    FOREACH v_service_id IN ARRAY p_service_ids
    LOOP
      SELECT price INTO v_service_price FROM services WHERE services.id = v_service_id;
      IF v_service_price IS NOT NULL THEN
        INSERT INTO queue_item_services (queue_item_id, service_id, price_at_time)
        VALUES (v_queue_id, v_service_id, v_service_price);
      END IF;
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT v_queue_id, v_ticket_number;
END;
$$;

-- Atualizar barber_add_client_direct com mesma lógica
CREATE OR REPLACE FUNCTION public.barber_add_client_direct(
  p_customer_name text, 
  p_customer_phone text, 
  p_service_ids uuid[] DEFAULT NULL::uuid[], 
  p_barber_id uuid DEFAULT NULL::uuid, 
  p_priority text DEFAULT 'normal'::text
)
RETURNS TABLE(id uuid, ticket_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_barber_id UUID;
  v_can_add_directly BOOLEAN;
  v_phone_normalized TEXT;
  v_active_ticket INTEGER;
  v_completed_today INTEGER;
  v_queue_id UUID;
  v_ticket_number TEXT;
  v_service_id UUID;
  v_service_price NUMERIC;
BEGIN
  -- Get the barber id for the authenticated user
  SELECT b.id, b.can_add_clients_directly INTO v_barber_id, v_can_add_directly
  FROM barbers b
  WHERE b.user_id = auth.uid();
  
  -- Check if barber exists and has permission
  IF v_barber_id IS NULL THEN
    RAISE EXCEPTION 'Barbeiro não encontrado';
  END IF;
  
  IF NOT v_can_add_directly THEN
    RAISE EXCEPTION 'Você não tem permissão para adicionar clientes diretamente. Solicite ao administrador.';
  END IF;
  
  -- Normalize phone (digits only)
  v_phone_normalized := regexp_replace(p_customer_phone, '[^0-9]', '', 'g');
  
  -- Validations
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF length(v_phone_normalized) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;
  
  -- Check for active ticket
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress')
  AND created_at::date = CURRENT_DATE;
  
  IF v_active_ticket > 0 THEN
    RAISE EXCEPTION 'Este cliente já está na fila de hoje.';
  END IF;
  
  -- Check daily limit (completed only)
  SELECT COUNT(*) INTO v_completed_today
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status = 'completed'
  AND created_at::date = CURRENT_DATE;
  
  IF v_completed_today >= 10 THEN
    RAISE EXCEPTION 'Este cliente atingiu o limite de 10 atendimentos hoje.';
  END IF;
  
  -- Validate priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;
  
  -- Insert queue item
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
    CASE WHEN p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN p_service_ids[1] ELSE NULL END,
    COALESCE(p_barber_id, v_barber_id),
    p_priority, 
    'presencial', 
    'waiting',
    ''
  )
  RETURNING queue_items.id, queue_items.ticket_number INTO v_queue_id, v_ticket_number;
  
  -- Insert all services into junction table
  IF p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN
    FOREACH v_service_id IN ARRAY p_service_ids
    LOOP
      SELECT price INTO v_service_price FROM services WHERE services.id = v_service_id;
      IF v_service_price IS NOT NULL THEN
        INSERT INTO queue_item_services (queue_item_id, service_id, price_at_time)
        VALUES (v_queue_id, v_service_id, v_service_price);
      END IF;
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT v_queue_id, v_ticket_number;
END;
$$;

-- Podemos remover a tabela queue_entry_log pois não será mais usada
-- (não vamos remover para não perder dados históricos, mas não será mais populada)