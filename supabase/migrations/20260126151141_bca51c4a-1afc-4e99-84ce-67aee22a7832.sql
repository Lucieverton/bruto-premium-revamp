-- Create table to track queue entries per phone (for rate limiting)
CREATE TABLE public.queue_entry_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_queue_entry_log_phone_time ON public.queue_entry_log (customer_phone, created_at DESC);

-- Enable RLS
ALTER TABLE public.queue_entry_log ENABLE ROW LEVEL SECURITY;

-- Only allow inserts via RPC (no direct access)
-- Admins can view for debugging
CREATE POLICY "Admins can view entry logs" 
ON public.queue_entry_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update join_queue function to enforce 5 entries limit with 30-minute cooldown
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
SET search_path TO 'public'
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
  
  -- CHECK IF CUSTOMER ALREADY HAS AN ACTIVE TICKET (waiting, called, or in_progress)
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress');
  
  IF v_active_ticket > 0 THEN
    RAISE EXCEPTION 'Você já está na fila. Aguarde seu atendimento ser finalizado.';
  END IF;
  
  -- CHECK RATE LIMIT: 5 entries per day
  SELECT COUNT(*), MAX(created_at) INTO v_recent_entries, v_last_entry_at
  FROM queue_entry_log
  WHERE customer_phone = v_phone_normalized
  AND created_at >= CURRENT_DATE;
  
  IF v_recent_entries >= 5 THEN
    -- Check if 30 minutes have passed since the last entry
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

-- Clean up old entry logs (older than 7 days) - for maintenance
CREATE OR REPLACE FUNCTION public.cleanup_old_entry_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM queue_entry_log WHERE created_at < now() - interval '7 days';
$$;