-- Add whatsapp_number column to barbers table
ALTER TABLE public.barbers 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Update get_public_queue to include barber's whatsapp
DROP FUNCTION IF EXISTS public.get_public_queue();

CREATE OR REPLACE FUNCTION public.get_public_queue()
 RETURNS TABLE(id uuid, ticket_number text, status text, priority text, created_at timestamp with time zone, called_at timestamp with time zone, service_id uuid, barber_id uuid, customer_name_masked text, service_name text, barber_name text, barber_whatsapp text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    qi.id,
    qi.ticket_number,
    qi.status,
    qi.priority,
    qi.created_at,
    qi.called_at,
    qi.service_id,
    qi.barber_id,
    CASE 
      WHEN qi.customer_name LIKE '% %' THEN 
        split_part(qi.customer_name, ' ', 1) || ' ' || 
        LEFT(split_part(qi.customer_name, ' ', 2), 1) || '.'
      ELSE qi.customer_name
    END as customer_name_masked,
    s.name as service_name,
    b.display_name as barber_name,
    b.whatsapp_number as barber_whatsapp
  FROM public.queue_items qi
  LEFT JOIN public.services s ON s.id = qi.service_id
  LEFT JOIN public.barbers b ON b.id = qi.barber_id
  WHERE qi.status IN ('waiting', 'called', 'in_progress')
  ORDER BY 
    CASE qi.priority WHEN 'preferencial' THEN 0 ELSE 1 END,
    qi.created_at ASC;
$function$;