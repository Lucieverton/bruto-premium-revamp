-- Phase 3.1: Get queue position for a specific ticket (using queue_position instead of reserved keyword)
CREATE OR REPLACE FUNCTION public.get_queue_position(p_ticket_id UUID)
RETURNS TABLE(queue_position INTEGER, total_waiting INTEGER, ticket_status TEXT, ticket_priority TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE((
      SELECT COUNT(*)::INTEGER + 1 FROM queue_items qi2 
      WHERE qi2.status = 'waiting' 
      AND (
        (qi2.priority = 'preferencial' AND qi.priority != 'preferencial')
        OR (qi2.priority = qi.priority AND qi2.created_at < qi.created_at)
        OR (qi2.priority = 'preferencial' AND qi.priority = 'preferencial' AND qi2.created_at < qi.created_at)
      )
    ), 1)::INTEGER as queue_position,
    (SELECT COUNT(*)::INTEGER FROM queue_items WHERE status = 'waiting') as total_waiting,
    qi.status as ticket_status,
    qi.priority as ticket_priority
  FROM queue_items qi
  WHERE qi.id = p_ticket_id;
$$;

-- Phase 3.2: Get queue statistics (public safe)
CREATE OR REPLACE FUNCTION public.get_queue_stats()
RETURNS TABLE(waiting_count INTEGER, in_progress_count INTEGER, avg_wait_minutes INTEGER)
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

-- Phase 3.3: Get active services with masked data for public display
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
  AND qi.created_at::date = CURRENT_DATE
  ORDER BY qi.called_at ASC;
$$;