-- 1. Criar RPC segura para entrada na fila (contorna RLS)
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
SET search_path = 'public'
AS $$
BEGIN
  -- Validações
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF length(regexp_replace(p_customer_phone, '[^0-9]', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;
  
  -- Validar priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;
  
  -- Insert (trigger gera ticket_number)
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
    regexp_replace(p_customer_phone, '[^0-9]', '', 'g'),
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

-- 2. Criar RPC para adicionar cliente presencial (admin only)
CREATE OR REPLACE FUNCTION public.add_walkin_client(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_service_id UUID DEFAULT NULL,
  p_barber_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS TABLE(id UUID, ticket_number TEXT)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem adicionar clientes presenciais';
  END IF;

  -- Validações
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF length(regexp_replace(p_customer_phone, '[^0-9]', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;
  
  -- Validar priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;
  
  -- Insert
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
    regexp_replace(p_customer_phone, '[^0-9]', '', 'g'),
    p_service_id,
    p_barber_id, 
    p_priority, 
    'presencial', 
    'waiting',
    ''
  )
  RETURNING queue_items.id, queue_items.ticket_number;
END;
$$;

-- 3. Corrigir constraint de payment_method para aceitar mais valores
ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_payment_method_check;

ALTER TABLE attendance_records 
ADD CONSTRAINT attendance_records_payment_method_check 
CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY[
  'dinheiro', 'pix', 'cartao', 'debito', 'credito', 'pendente'
]));