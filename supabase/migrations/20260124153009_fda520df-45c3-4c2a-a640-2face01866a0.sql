-- ==========================================
-- CORREÇÃO 1: RLS para permitir barbeiros gerenciarem tickets
-- ==========================================

-- Drop a política problemática que só permite atualizar tickets já atribuídos
DROP POLICY IF EXISTS "Barbers can update assigned queue items" ON public.queue_items;

-- Nova política: Barbeiros podem atualizar tickets chamados (called) ou em progresso (in_progress)
CREATE POLICY "Barbers can update called or in_progress items"
ON public.queue_items
FOR UPDATE
USING (
  has_role(auth.uid(), 'barber'::app_role) 
  AND status IN ('called', 'in_progress')
)
WITH CHECK (
  has_role(auth.uid(), 'barber'::app_role) 
  AND status IN ('called', 'in_progress')
);

-- Barbeiros também podem chamar clientes em espera
CREATE POLICY "Barbers can call waiting clients"
ON public.queue_items
FOR UPDATE
USING (
  has_role(auth.uid(), 'barber'::app_role) 
  AND status = 'waiting'
)
WITH CHECK (
  has_role(auth.uid(), 'barber'::app_role) 
  AND status IN ('waiting', 'called')
);

-- ==========================================
-- CORREÇÃO 2: Atualizar status dos barbeiros para 'online'
-- ==========================================

UPDATE public.barbers 
SET status = 'online' 
WHERE is_active = true AND is_available = true AND status = 'offline';

-- ==========================================
-- CORREÇÃO 3: RPC para barbeiro obter seus atendimentos atuais
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_barber_queue(p_barber_id UUID)
RETURNS TABLE(
  id UUID,
  ticket_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT,
  priority TEXT,
  service_id UUID,
  called_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    qi.id,
    qi.ticket_number,
    qi.customer_name,
    qi.customer_phone,
    qi.status,
    qi.priority,
    qi.service_id,
    qi.called_at,
    qi.created_at
  FROM queue_items qi
  WHERE qi.barber_id = p_barber_id
  AND qi.status IN ('called', 'in_progress')
  AND qi.created_at::date = CURRENT_DATE
  ORDER BY qi.called_at ASC;
$$;

-- ==========================================
-- CORREÇÃO 4: RPC para atualizar status do barbeiro de forma segura
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_barber_status(
  p_barber_id UUID,
  p_status TEXT,
  p_is_available BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validar status (deve ser online, away ou offline)
  IF p_status NOT IN ('online', 'away', 'offline') THEN
    RAISE EXCEPTION 'Status inválido. Use: online, away ou offline';
  END IF;

  -- Verificar se o barbeiro pertence ao usuário autenticado
  SELECT user_id INTO v_user_id FROM barbers WHERE id = p_barber_id;
  
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    -- Se não é o próprio barbeiro, verificar se é admin
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Não autorizado';
    END IF;
  END IF;
  
  -- Atualizar status
  UPDATE barbers 
  SET status = p_status, is_available = p_is_available
  WHERE id = p_barber_id;
  
  RETURN TRUE;
END;
$$;

-- ==========================================
-- CORREÇÃO 5: RPC para barbeiro iniciar atendimento
-- ==========================================

CREATE OR REPLACE FUNCTION public.barber_start_service(
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
BEGIN
  -- Verificar se o barbeiro pertence ao usuário autenticado ou é admin
  SELECT user_id INTO v_user_id FROM barbers WHERE id = p_barber_id;
  
  IF v_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Verificar status do ticket
  SELECT status INTO v_ticket_status FROM queue_items WHERE id = p_ticket_id;
  
  IF v_ticket_status NOT IN ('waiting', 'called') THEN
    RAISE EXCEPTION 'Este cliente não pode ser atendido (status: %)', v_ticket_status;
  END IF;
  
  -- Atualizar ticket
  UPDATE queue_items 
  SET 
    status = 'in_progress',
    barber_id = p_barber_id,
    is_called = true,
    called_at = COALESCE(called_at, now())
  WHERE id = p_ticket_id;
  
  -- Atualizar status do barbeiro para away (ocupado)
  UPDATE barbers 
  SET status = 'away', is_available = false
  WHERE id = p_barber_id;
  
  RETURN TRUE;
END;
$$;

-- ==========================================
-- CORREÇÃO 6: RPC para barbeiro finalizar atendimento
-- ==========================================

CREATE OR REPLACE FUNCTION public.barber_complete_service(
  p_ticket_id UUID,
  p_price_charged NUMERIC,
  p_payment_method TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barber_id UUID;
  v_barber_user_id UUID;
  v_queue_item RECORD;
BEGIN
  -- Obter dados do ticket
  SELECT * INTO v_queue_item FROM queue_items WHERE id = p_ticket_id;
  
  IF v_queue_item IS NULL THEN
    RAISE EXCEPTION 'Ticket não encontrado';
  END IF;
  
  IF v_queue_item.status != 'in_progress' THEN
    RAISE EXCEPTION 'Este atendimento não está em andamento';
  END IF;
  
  -- Verificar autorização
  SELECT user_id INTO v_barber_user_id FROM barbers WHERE id = v_queue_item.barber_id;
  
  IF v_barber_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Finalizar ticket
  UPDATE queue_items 
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = p_ticket_id;
  
  -- Criar registro de atendimento
  INSERT INTO attendance_records (
    queue_item_id,
    barber_id,
    service_id,
    customer_name,
    price_charged,
    payment_method
  ) VALUES (
    p_ticket_id,
    v_queue_item.barber_id,
    v_queue_item.service_id,
    v_queue_item.customer_name,
    p_price_charged,
    p_payment_method
  );
  
  -- Atualizar status do barbeiro para online (disponível)
  UPDATE barbers 
  SET status = 'online', is_available = true
  WHERE id = v_queue_item.barber_id;
  
  RETURN TRUE;
END;
$$;