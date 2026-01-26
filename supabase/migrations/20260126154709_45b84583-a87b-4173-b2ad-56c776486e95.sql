-- Create secure RPC function for clients to leave the queue
-- This bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.leave_queue(p_ticket_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
BEGIN
  -- Get the ticket
  SELECT id, status INTO v_ticket
  FROM queue_items
  WHERE id = p_ticket_id;
  
  -- Ticket not found
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Only allow cancellation if ticket is in an active state
  IF v_ticket.status NOT IN ('waiting', 'called') THEN
    RETURN false;
  END IF;
  
  -- Cancel the ticket
  UPDATE queue_items
  SET 
    status = 'cancelled',
    completed_at = now()
  WHERE id = p_ticket_id;
  
  RETURN true;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.leave_queue(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.leave_queue(uuid) TO authenticated;