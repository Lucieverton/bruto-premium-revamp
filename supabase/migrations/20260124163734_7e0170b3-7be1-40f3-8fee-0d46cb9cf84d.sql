-- ================================================
-- PHASE 2 & 4: Queue Requests and Transfers Tables
-- ================================================

-- Table for barber queue entry requests (requires admin approval)
CREATE TABLE public.queue_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  requested_by UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  
  CONSTRAINT valid_priority CHECK (priority IN ('normal', 'preferencial')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Table for client transfers between barbers
CREATE TABLE public.queue_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID REFERENCES public.queue_items(id) ON DELETE CASCADE NOT NULL,
  from_barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  to_barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_transfer_status CHECK (status IN ('completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.queue_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_transfers ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies for queue_requests
-- ================================================

-- Admins can do everything with requests
CREATE POLICY "Admins can manage all requests"
ON public.queue_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Barbers can view their own requests
CREATE POLICY "Barbers can view own requests"
ON public.queue_requests FOR SELECT
USING (
  has_role(auth.uid(), 'barber'::app_role) AND 
  requested_by = (SELECT id FROM public.barbers WHERE user_id = auth.uid())
);

-- Barbers can create requests
CREATE POLICY "Barbers can create requests"
ON public.queue_requests FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'barber'::app_role) AND 
  requested_by = (SELECT id FROM public.barbers WHERE user_id = auth.uid())
);

-- ================================================
-- RLS Policies for queue_transfers
-- ================================================

-- Admins can see all transfers
CREATE POLICY "Admins can view all transfers"
ON public.queue_transfers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Barbers can view transfers involving them
CREATE POLICY "Barbers can view own transfers"
ON public.queue_transfers FOR SELECT
USING (
  has_role(auth.uid(), 'barber'::app_role) AND 
  (
    from_barber_id = (SELECT id FROM public.barbers WHERE user_id = auth.uid()) OR
    to_barber_id = (SELECT id FROM public.barbers WHERE user_id = auth.uid())
  )
);

-- Barbers can create transfers from their clients
CREATE POLICY "Barbers can create transfers"
ON public.queue_transfers FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'barber'::app_role) AND 
  from_barber_id = (SELECT id FROM public.barbers WHERE user_id = auth.uid())
);

-- ================================================
-- RPC Function to approve queue request
-- ================================================
CREATE OR REPLACE FUNCTION public.approve_queue_request(p_request_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_new_queue_id UUID;
BEGIN
  -- Verify admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar solicitações';
  END IF;
  
  -- Get request data
  SELECT * INTO v_request FROM queue_requests WHERE id = p_request_id AND status = 'pending';
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;
  
  -- Create queue item
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
    v_request.customer_name,
    v_request.customer_phone,
    v_request.service_id,
    v_request.barber_id,
    v_request.priority,
    'presencial',
    'waiting',
    ''
  )
  RETURNING id INTO v_new_queue_id;
  
  -- Update request status
  UPDATE queue_requests
  SET 
    status = 'approved',
    admin_notes = p_notes,
    processed_at = now(),
    processed_by = auth.uid()
  WHERE id = p_request_id;
  
  RETURN v_new_queue_id;
END;
$$;

-- ================================================
-- RPC Function to reject queue request
-- ================================================
CREATE OR REPLACE FUNCTION public.reject_queue_request(p_request_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar solicitações';
  END IF;
  
  -- Update request status
  UPDATE queue_requests
  SET 
    status = 'rejected',
    admin_notes = p_notes,
    processed_at = now(),
    processed_by = auth.uid()
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- ================================================
-- RPC Function to transfer client
-- ================================================
CREATE OR REPLACE FUNCTION public.transfer_queue_client(
  p_queue_item_id UUID,
  p_to_barber_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_barber_id UUID;
  v_item_status TEXT;
BEGIN
  -- Get current item data
  SELECT barber_id, status INTO v_from_barber_id, v_item_status
  FROM queue_items WHERE id = p_queue_item_id;
  
  IF v_item_status IS NULL THEN
    RAISE EXCEPTION 'Item da fila não encontrado';
  END IF;
  
  IF v_item_status NOT IN ('waiting', 'called') THEN
    RAISE EXCEPTION 'Só é possível transferir clientes aguardando ou chamados';
  END IF;
  
  -- Verify permission: must be admin, from_barber, or item has no barber
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    v_from_barber_id = (SELECT id FROM barbers WHERE user_id = auth.uid()) OR
    v_from_barber_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Não autorizado a transferir este cliente';
  END IF;
  
  -- Record the transfer
  INSERT INTO queue_transfers (queue_item_id, from_barber_id, to_barber_id, reason)
  VALUES (p_queue_item_id, v_from_barber_id, p_to_barber_id, p_reason);
  
  -- Update queue item
  UPDATE queue_items
  SET barber_id = p_to_barber_id
  WHERE id = p_queue_item_id;
  
  RETURN TRUE;
END;
$$;

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_transfers;