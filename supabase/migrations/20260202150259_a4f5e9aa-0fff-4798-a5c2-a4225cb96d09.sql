-- ============================================
-- CORREÇÃO: Fila Virtual - Reset Diário
-- ============================================

-- 1. DROP das funções existentes para recriar com a lógica correta
DROP FUNCTION IF EXISTS public.join_queue(text, text, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_public_queue();
DROP FUNCTION IF EXISTS public.get_queue_stats();
DROP FUNCTION IF EXISTS public.get_active_services_public();
DROP FUNCTION IF EXISTS public.cleanup_stale_tickets();

-- 2. Recriar join_queue com verificação de data
CREATE OR REPLACE FUNCTION public.join_queue(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_service_id UUID DEFAULT NULL,
  p_barber_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS TABLE(id UUID, ticket_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone_normalized TEXT;
  v_active_ticket INTEGER;
  v_recent_entries INTEGER;
  v_last_entry_at TIMESTAMP WITH TIME ZONE;
  v_minutes_since_last INTEGER;
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
  
  -- CHECK IF CUSTOMER ALREADY HAS AN ACTIVE TICKET TODAY (CRITICAL FIX)
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress')
  AND created_at::date = CURRENT_DATE;  -- FILTRO POR DATA ADICIONADO
  
  IF v_active_ticket > 0 THEN
    RAISE EXCEPTION 'Você já está na fila de hoje. Aguarde seu atendimento.';
  END IF;
  
  -- CHECK RATE LIMIT: 5 entries per day
  SELECT COUNT(*), MAX(created_at) INTO v_recent_entries, v_last_entry_at
  FROM queue_entry_log
  WHERE customer_phone = v_phone_normalized
  AND created_at >= CURRENT_DATE;
  
  IF v_recent_entries >= 5 THEN
    IF v_last_entry_at IS NOT NULL THEN
      v_minutes_since_last := EXTRACT(EPOCH FROM (now() - v_last_entry_at)) / 60;
      
      IF v_minutes_since_last < 30 THEN
        RAISE EXCEPTION 'Você atingiu o limite de 5 entradas hoje. Aguarde % minutos para entrar novamente.', 
          (30 - v_minutes_since_last)::INTEGER;
      END IF;
    END IF;
  END IF;
  
  -- Validate priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;
  
  -- Log this entry attempt
  INSERT INTO queue_entry_log (customer_phone) VALUES (v_phone_normalized);
  
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
$$;

-- 3. Recriar get_public_queue com filtro de data
CREATE OR REPLACE FUNCTION public.get_public_queue()
RETURNS TABLE(
  id UUID,
  ticket_number TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ,
  service_id UUID,
  barber_id UUID,
  customer_name_masked TEXT,
  service_name TEXT,
  barber_name TEXT,
  barber_whatsapp TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    qi.id,
    qi.ticket_number,
    qi.status,
    qi.priority,
    qi.created_at,
    qi.called_at,
    qi.service_id,
    qi.barber_id,
    CASE 
      WHEN qi.customer_name LIKE '% %' THEN 
        split_part(qi.customer_name, ' ', 1) || ' ' || 
        LEFT(split_part(qi.customer_name, ' ', 2), 1) || '.'
      ELSE qi.customer_name
    END as customer_name_masked,
    s.name as service_name,
    b.display_name as barber_name,
    b.whatsapp_number as barber_whatsapp
  FROM public.queue_items qi
  LEFT JOIN public.services s ON s.id = qi.service_id
  LEFT JOIN public.barbers b ON b.id = qi.barber_id
  WHERE qi.status IN ('waiting', 'called', 'in_progress')
  AND qi.created_at::date = CURRENT_DATE  -- FILTRO POR DATA ADICIONADO
  ORDER BY 
    CASE qi.priority WHEN 'preferencial' THEN 0 ELSE 1 END,
    qi.created_at ASC;
$$;

-- 4. Recriar get_queue_stats com filtro de data
CREATE OR REPLACE FUNCTION public.get_queue_stats()
RETURNS TABLE(
  waiting_count INTEGER,
  in_progress_count INTEGER,
  avg_wait_minutes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM queue_items WHERE status = 'waiting' AND created_at::date = CURRENT_DATE) as waiting_count,
    (SELECT COUNT(*)::INTEGER FROM queue_items WHERE status IN ('called', 'in_progress') AND created_at::date = CURRENT_DATE) as in_progress_count,
    COALESCE(
      (SELECT AVG(EXTRACT(EPOCH FROM (called_at - created_at))/60)::INTEGER 
       FROM queue_items 
       WHERE status IN ('called', 'in_progress', 'completed') 
       AND called_at IS NOT NULL 
       AND created_at::date = CURRENT_DATE),
      20
    )::INTEGER as avg_wait_minutes;
$$;

-- 5. Recriar get_active_services_public com filtro de data
CREATE OR REPLACE FUNCTION public.get_active_services_public()
RETURNS TABLE(
  id UUID,
  ticket_number TEXT,
  service_status TEXT,
  priority TEXT,
  customer_first_name TEXT,
  barber_id UUID,
  barber_name TEXT,
  service_id UUID,
  started_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    qi.id,
    qi.ticket_number,
    qi.status as service_status,
    qi.priority,
    split_part(qi.customer_name, ' ', 1) as customer_first_name,
    qi.barber_id,
    b.display_name as barber_name,
    qi.service_id,
    qi.called_at as started_at
  FROM queue_items qi
  LEFT JOIN barbers b ON b.id = qi.barber_id
  WHERE qi.status IN ('called', 'in_progress')
  AND qi.created_at::date = CURRENT_DATE  -- FILTRO POR DATA ADICIONADO
  ORDER BY qi.called_at ASC;
$$;

-- 6. Criar função de limpeza de tickets antigos (para admins chamarem manualmente)
CREATE OR REPLACE FUNCTION public.cleanup_stale_tickets()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Cancel all active tickets from previous days
  UPDATE queue_items
  SET status = 'cancelled', completed_at = now()
  WHERE status IN ('waiting', 'called', 'in_progress')
  AND created_at::date < CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 7. EXECUTAR LIMPEZA IMEDIATA: Cancelar tickets antigos existentes
UPDATE queue_items
SET status = 'cancelled', completed_at = now()
WHERE status IN ('waiting', 'called', 'in_progress')
AND created_at::date < CURRENT_DATE;