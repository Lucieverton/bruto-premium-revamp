
CREATE OR REPLACE FUNCTION public.barber_complete_service(p_ticket_id uuid, p_price_charged numeric, p_payment_method text DEFAULT NULL::text, p_services jsonb DEFAULT NULL::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_barber_id UUID;
  v_barber_user_id UUID;
  v_queue_item RECORD;
  v_attendance_id UUID;
  v_service RECORD;
BEGIN
  SELECT * INTO v_queue_item FROM queue_items WHERE id = p_ticket_id;
  
  IF v_queue_item IS NULL THEN
    RAISE EXCEPTION 'Ticket não encontrado';
  END IF;
  
  IF v_queue_item.status != 'in_progress' THEN
    RAISE EXCEPTION 'Este atendimento não está em andamento';
  END IF;
  
  SELECT user_id INTO v_barber_user_id FROM barbers WHERE id = v_queue_item.barber_id;
  
  IF v_barber_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Update queue item status
  UPDATE queue_items 
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = p_ticket_id;
  
  -- Create attendance record WITH group_id and companion_name
  INSERT INTO attendance_records (
    queue_item_id, barber_id, service_id, customer_name, price_charged, payment_method, group_id, companion_name
  ) VALUES (
    p_ticket_id, v_queue_item.barber_id, v_queue_item.service_id, 
    v_queue_item.customer_name, p_price_charged, p_payment_method,
    v_queue_item.group_id, v_queue_item.companion_name
  )
  RETURNING id INTO v_attendance_id;
  
  -- Insert individual service records if provided
  IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_to_recordset(p_services) 
      AS x(service_id uuid, service_name text, price_charged numeric)
    LOOP
      INSERT INTO attendance_record_services (
        attendance_record_id, service_id, service_name, price_charged
      ) VALUES (
        v_attendance_id, v_service.service_id, v_service.service_name, v_service.price_charged
      );
    END LOOP;
  ELSE
    -- Fallback: get services from queue_item_services if no explicit list provided
    INSERT INTO attendance_record_services (
      attendance_record_id, service_id, service_name, price_charged
    )
    SELECT 
      v_attendance_id,
      qis.service_id,
      s.name,
      qis.price_at_time
    FROM queue_item_services qis
    JOIN services s ON s.id = qis.service_id
    WHERE qis.queue_item_id = p_ticket_id;
  END IF;
  
  -- Update barber status
  UPDATE barbers 
  SET status = 'online', is_available = true
  WHERE id = v_queue_item.barber_id;
  
  RETURN TRUE;
END;
$function$;
