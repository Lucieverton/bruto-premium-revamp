-- Create table to store individual service records for attendance (financial tracking)
CREATE TABLE IF NOT EXISTS public.attendance_record_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_record_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  service_name TEXT NOT NULL,
  price_charged NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_record_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage attendance services"
  ON public.attendance_record_services FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Barbers can view own attendance services"
  ON public.attendance_record_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attendance_records ar
      JOIN barbers b ON b.id = ar.barber_id
      WHERE ar.id = attendance_record_services.attendance_record_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Barbers can insert own attendance services"
  ON public.attendance_record_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_records ar
      JOIN barbers b ON b.id = ar.barber_id
      WHERE ar.id = attendance_record_services.attendance_record_id
      AND b.user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX idx_attendance_record_services_record_id 
  ON public.attendance_record_services(attendance_record_id);

-- Update barber_complete_service to accept service details as JSON array
CREATE OR REPLACE FUNCTION public.barber_complete_service(
  p_ticket_id uuid, 
  p_price_charged numeric, 
  p_payment_method text DEFAULT NULL::text,
  p_services jsonb DEFAULT NULL::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Create attendance record
  INSERT INTO attendance_records (
    queue_item_id, barber_id, service_id, customer_name, price_charged, payment_method
  ) VALUES (
    p_ticket_id, v_queue_item.barber_id, v_queue_item.service_id, 
    v_queue_item.customer_name, p_price_charged, p_payment_method
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
$$;

-- Create function to get services for display in queue
CREATE OR REPLACE FUNCTION public.get_queue_item_services_summary(p_queue_item_id uuid)
RETURNS TABLE(
  total_services integer,
  total_price numeric,
  services_list text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(*)::integer as total_services,
    COALESCE(SUM(qis.price_at_time), 0) as total_price,
    string_agg(s.name, ', ' ORDER BY qis.created_at) as services_list
  FROM queue_item_services qis
  JOIN services s ON s.id = qis.service_id
  WHERE qis.queue_item_id = p_queue_item_id;
$$;

-- Create function to get attendance records with service details
CREATE OR REPLACE FUNCTION public.get_attendance_with_services(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone,
  p_barber_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  queue_item_id uuid,
  barber_id uuid,
  customer_name text,
  price_charged numeric,
  payment_method text,
  completed_at timestamp with time zone,
  services jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    ) as services
  FROM attendance_records ar
  WHERE ar.completed_at >= p_start_date
  AND ar.completed_at <= p_end_date
  AND (p_barber_id IS NULL OR ar.barber_id = p_barber_id)
  ORDER BY ar.completed_at DESC;
$$;