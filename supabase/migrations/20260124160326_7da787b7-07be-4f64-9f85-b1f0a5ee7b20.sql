-- Fix 1: Add search_path to get_client_ticket_id function
CREATE OR REPLACE FUNCTION public.get_client_ticket_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT current_setting('app.client_ticket_id', true)
$function$;

-- Fix 2: Update join_queue to add server-side rate limiting (max 5 entries per phone per day)
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
DECLARE
  v_phone_normalized TEXT;
  v_today_entries INTEGER;
  v_daily_limit INTEGER := 5;
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
  
  -- SERVER-SIDE RATE LIMITING: Check how many entries this phone has today
  SELECT COUNT(*) INTO v_today_entries
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND created_at::date = CURRENT_DATE;
  
  IF v_today_entries >= v_daily_limit THEN
    RAISE EXCEPTION 'Limite diário de entradas atingido. Máximo % por telefone por dia.', v_daily_limit;
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
$$;

-- Fix 3: Create audit_logs table for edge function audit logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);