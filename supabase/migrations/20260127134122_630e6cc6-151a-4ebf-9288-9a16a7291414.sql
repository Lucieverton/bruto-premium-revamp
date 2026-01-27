-- Create a secure RPC for barbers with direct entry permission to add clients
CREATE OR REPLACE FUNCTION public.barber_add_client_direct(
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
  v_barber_id UUID;
  v_can_add_directly BOOLEAN;
  v_phone_normalized TEXT;
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
    COALESCE(p_barber_id, v_barber_id), -- Default to the barber adding the client
    p_priority, 
    'presencial', 
    'waiting',
    ''
  )
  RETURNING queue_items.id, queue_items.ticket_number;
END;
$$;

-- Create a secure RPC for barbers to call a client without starting service
CREATE OR REPLACE FUNCTION public.barber_call_client(
  p_ticket_id UUID,
  p_barber_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_ticket_status TEXT;
  v_ticket_barber_id UUID;
BEGIN
  -- Verify barber authorization
  SELECT user_id INTO v_user_id FROM barbers WHERE id = p_barber_id;
  
  IF v_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Get ticket info
  SELECT status, barber_id INTO v_ticket_status, v_ticket_barber_id 
  FROM queue_items WHERE id = p_ticket_id;
  
  IF v_ticket_status IS NULL THEN
    RAISE EXCEPTION 'Ticket não encontrado';
  END IF;
  
  IF v_ticket_status != 'waiting' THEN
    RAISE EXCEPTION 'Este cliente já foi chamado ou está em atendimento';
  END IF;
  
  -- Update ticket to called status
  UPDATE queue_items 
  SET 
    status = 'called',
    barber_id = p_barber_id,
    is_called = true,
    called_at = now()
  WHERE id = p_ticket_id;
  
  RETURN TRUE;
END;
$$;