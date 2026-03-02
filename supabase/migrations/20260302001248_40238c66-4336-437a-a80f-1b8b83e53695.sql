
-- Add group_id to queue_items to link companions
ALTER TABLE public.queue_items 
ADD COLUMN group_id uuid DEFAULT NULL,
ADD COLUMN companion_name text DEFAULT NULL;

-- Index for fast group lookups
CREATE INDEX idx_queue_items_group_id ON public.queue_items(group_id) WHERE group_id IS NOT NULL;

-- Create RPC for group queue entry
CREATE OR REPLACE FUNCTION public.join_queue_group(
  p_customer_name text,
  p_customer_phone text,
  p_service_ids uuid[] DEFAULT NULL,
  p_barber_id uuid DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_companions jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(id uuid, ticket_number text, group_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone_normalized TEXT;
  v_active_ticket INTEGER;
  v_group_id UUID;
  v_queue_id UUID;
  v_ticket_number TEXT;
  v_service_id UUID;
  v_service_price NUMERIC;
  v_companion RECORD;
  v_companion_service_ids UUID[];
  v_companion_barber_id UUID;
  v_companion_count INTEGER;
BEGIN
  -- Normalize phone
  v_phone_normalized := regexp_replace(p_customer_phone, '[^0-9]', '', 'g');
  
  -- Validations
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF length(v_phone_normalized) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;

  -- Validate companion count (max 5)
  v_companion_count := jsonb_array_length(COALESCE(p_companions, '[]'::jsonb));
  IF v_companion_count > 5 THEN
    RAISE EXCEPTION 'Máximo de 5 acompanhantes permitidos';
  END IF;
  
  -- Check if customer already has active ticket
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress')
  AND created_at::date = CURRENT_DATE;
  
  IF v_active_ticket > 0 THEN
    RAISE EXCEPTION 'Você já está na fila de hoje. Aguarde seu atendimento.';
  END IF;
  
  -- Validate priority
  IF p_priority NOT IN ('normal', 'preferencial') THEN
    p_priority := 'normal';
  END IF;

  -- Generate group_id if there are companions
  IF v_companion_count > 0 THEN
    v_group_id := gen_random_uuid();
  END IF;
  
  -- Insert leader
  INSERT INTO queue_items (
    customer_name, customer_phone, service_id, barber_id, 
    priority, origin, status, ticket_number, group_id
  ) VALUES (
    trim(p_customer_name), v_phone_normalized,
    CASE WHEN p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN p_service_ids[1] ELSE NULL END,
    p_barber_id, p_priority, 'online', 'waiting', '', v_group_id
  )
  RETURNING queue_items.id, queue_items.ticket_number INTO v_queue_id, v_ticket_number;
  
  -- Insert leader services
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
  
  -- Return leader
  id := v_queue_id;
  ticket_number := v_ticket_number;
  group_id := v_group_id;
  RETURN NEXT;
  
  -- Insert companions
  FOR v_companion IN SELECT * FROM jsonb_to_recordset(p_companions) 
    AS x(name text, service_ids jsonb, barber_id text)
  LOOP
    IF length(trim(COALESCE(v_companion.name, ''))) < 2 THEN
      RAISE EXCEPTION 'Nome do acompanhante deve ter pelo menos 2 caracteres';
    END IF;
    
    -- Parse companion barber_id
    v_companion_barber_id := CASE 
      WHEN v_companion.barber_id IS NOT NULL AND v_companion.barber_id != '' 
      THEN v_companion.barber_id::uuid 
      ELSE p_barber_id 
    END;
    
    -- Parse companion service_ids
    SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_companion.service_ids, '[]'::jsonb))::uuid)
    INTO v_companion_service_ids;
    
    -- Insert companion queue item
    INSERT INTO queue_items (
      customer_name, customer_phone, service_id, barber_id,
      priority, origin, status, ticket_number, group_id, companion_name
    ) VALUES (
      trim(v_companion.name), v_phone_normalized,
      CASE WHEN v_companion_service_ids IS NOT NULL AND array_length(v_companion_service_ids, 1) > 0 THEN v_companion_service_ids[1] ELSE NULL END,
      v_companion_barber_id, p_priority, 'online', 'waiting', '',
      v_group_id, trim(p_customer_name)
    )
    RETURNING queue_items.id, queue_items.ticket_number INTO v_queue_id, v_ticket_number;
    
    -- Insert companion services
    IF v_companion_service_ids IS NOT NULL AND array_length(v_companion_service_ids, 1) > 0 THEN
      FOREACH v_service_id IN ARRAY v_companion_service_ids
      LOOP
        SELECT price INTO v_service_price FROM services WHERE services.id = v_service_id;
        IF v_service_price IS NOT NULL THEN
          INSERT INTO queue_item_services (queue_item_id, service_id, price_at_time)
          VALUES (v_queue_id, v_service_id, v_service_price);
        END IF;
      END LOOP;
    END IF;
    
    -- Return companion
    id := v_queue_id;
    ticket_number := v_ticket_number;
    group_id := v_group_id;
    RETURN NEXT;
  END LOOP;
END;
$$;
