-- 1. Fix get_queue_position to filter by current date
CREATE OR REPLACE FUNCTION public.get_queue_position(p_ticket_id uuid)
 RETURNS TABLE(queue_position integer, total_waiting integer, ticket_status text, ticket_priority text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE((
      SELECT COUNT(*)::INTEGER + 1 FROM queue_items qi2 
      WHERE qi2.status = 'waiting' 
      AND qi2.created_at::date = CURRENT_DATE
      AND (
        (qi2.priority = 'preferencial' AND qi.priority != 'preferencial')
        OR (qi2.priority = qi.priority AND qi2.created_at < qi.created_at)
        OR (qi2.priority = 'preferencial' AND qi.priority = 'preferencial' AND qi2.created_at < qi.created_at)
      )
    ), 1)::INTEGER as queue_position,
    (SELECT COUNT(*)::INTEGER FROM queue_items 
     WHERE status = 'waiting' 
     AND created_at::date = CURRENT_DATE) as total_waiting,
    qi.status as ticket_status,
    qi.priority as ticket_priority
  FROM queue_items qi
  WHERE qi.id = p_ticket_id;
$function$;

-- 2. Run cleanup once to clear stale tickets from previous days
SELECT public.cleanup_stale_tickets();

-- 3. Create trigger function that runs cleanup before each insert
CREATE OR REPLACE FUNCTION public.trigger_cleanup_stale_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Cancel stale tickets from previous days before new insert
  UPDATE queue_items
  SET status = 'cancelled', completed_at = now()
  WHERE status IN ('waiting', 'called', 'in_progress')
  AND created_at::date < CURRENT_DATE;
  
  RETURN NEW;
END;
$$;

-- 4. Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS cleanup_stale_before_insert ON public.queue_items;

CREATE TRIGGER cleanup_stale_before_insert
BEFORE INSERT ON public.queue_items
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_cleanup_stale_tickets();