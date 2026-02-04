-- Create junction table for multiple services per queue item
CREATE TABLE public.queue_item_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_item_id UUID NOT NULL REFERENCES public.queue_items(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price_at_time NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(queue_item_id, service_id)
);

-- Enable RLS
ALTER TABLE public.queue_item_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view queue item services"
ON public.queue_item_services
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'barber'::app_role)
);

CREATE POLICY "Admins can manage queue item services"
ON public.queue_item_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_item_services;

-- Update join_queue to accept array of service_ids
CREATE OR REPLACE FUNCTION public.join_queue(
  p_customer_name text, 
  p_customer_phone text, 
  p_service_ids uuid[] DEFAULT NULL::uuid[], -- Changed to array
  p_barber_id uuid DEFAULT NULL::uuid, 
  p_priority text DEFAULT 'normal'::text
)
RETURNS TABLE(id uuid, ticket_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone_normalized TEXT;
  v_active_ticket INTEGER;
  v_recent_entries INTEGER;
  v_last_entry_at TIMESTAMP WITH TIME ZONE;
  v_minutes_since_last INTEGER;
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
$function$;

-- Function to add extra service to existing queue item (for barbers during finalization)
CREATE OR REPLACE FUNCTION public.add_service_to_queue_item(
  p_queue_item_id uuid,
  p_service_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_queue_item RECORD;
  v_service_price NUMERIC;
  v_barber_user_id UUID;
BEGIN
  -- Get queue item
  SELECT * INTO v_queue_item FROM queue_items WHERE id = p_queue_item_id;
  
  IF v_queue_item IS NULL THEN
    RAISE EXCEPTION 'Item da fila não encontrado';
  END IF;
  
  -- Check authorization (must be admin or the assigned barber)
  IF v_queue_item.barber_id IS NOT NULL THEN
    SELECT user_id INTO v_barber_user_id FROM barbers WHERE id = v_queue_item.barber_id;
    IF v_barber_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Não autorizado';
    END IF;
  ELSIF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Get service price
  SELECT price INTO v_service_price FROM services WHERE id = p_service_id AND is_active = true;
  
  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'Serviço não encontrado ou inativo';
  END IF;
  
  -- Insert service (will fail silently if already exists due to unique constraint)
  INSERT INTO queue_item_services (queue_item_id, service_id, price_at_time)
  VALUES (p_queue_item_id, p_service_id, v_service_price)
  ON CONFLICT (queue_item_id, service_id) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

-- Function to remove service from queue item
CREATE OR REPLACE FUNCTION public.remove_service_from_queue_item(
  p_queue_item_id uuid,
  p_service_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_queue_item RECORD;
  v_barber_user_id UUID;
  v_service_count INTEGER;
BEGIN
  -- Get queue item
  SELECT * INTO v_queue_item FROM queue_items WHERE id = p_queue_item_id;
  
  IF v_queue_item IS NULL THEN
    RAISE EXCEPTION 'Item da fila não encontrado';
  END IF;
  
  -- Check authorization
  IF v_queue_item.barber_id IS NOT NULL THEN
    SELECT user_id INTO v_barber_user_id FROM barbers WHERE id = v_queue_item.barber_id;
    IF v_barber_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Não autorizado';
    END IF;
  ELSIF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Check if this is the last service
  SELECT COUNT(*) INTO v_service_count FROM queue_item_services WHERE queue_item_id = p_queue_item_id;
  
  IF v_service_count <= 1 THEN
    RAISE EXCEPTION 'Não é possível remover o único serviço';
  END IF;
  
  -- Delete service
  DELETE FROM queue_item_services 
  WHERE queue_item_id = p_queue_item_id AND service_id = p_service_id;
  
  RETURN TRUE;
END;
$function$;

-- Function to get queue item services with prices
CREATE OR REPLACE FUNCTION public.get_queue_item_services(p_queue_item_id uuid)
RETURNS TABLE(
  service_id uuid,
  service_name text,
  price_at_time numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    qis.service_id,
    s.name as service_name,
    qis.price_at_time
  FROM queue_item_services qis
  JOIN services s ON s.id = qis.service_id
  WHERE qis.queue_item_id = p_queue_item_id
  ORDER BY qis.created_at ASC;
$function$;