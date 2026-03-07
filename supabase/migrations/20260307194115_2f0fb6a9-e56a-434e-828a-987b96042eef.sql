
DROP FUNCTION public.get_attendance_with_services(timestamp with time zone, timestamp with time zone, uuid);

CREATE FUNCTION public.get_attendance_with_services(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_barber_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, queue_item_id uuid, barber_id uuid, customer_name text, price_charged numeric, payment_method text, completed_at timestamp with time zone, services jsonb, group_id uuid, companion_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ar.id,
    ar.queue_item_id,
    ar.barber_id,
    ar.customer_name,
    ar.price_charged,
    ar.payment_method,
    ar.completed_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'service_id', ars.service_id,
        'service_name', ars.service_name,
        'price_charged', ars.price_charged
      ) ORDER BY ars.created_at)
      FROM attendance_record_services ars
      WHERE ars.attendance_record_id = ar.id),
      '[]'::jsonb
    ) as services,
    ar.group_id,
    ar.companion_name
  FROM attendance_records ar
  WHERE ar.completed_at >= p_start_date
  AND ar.completed_at <= p_end_date
  AND (p_barber_id IS NULL OR ar.barber_id = p_barber_id)
  ORDER BY ar.completed_at DESC;
$function$;
