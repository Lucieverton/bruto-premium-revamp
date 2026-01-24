-- Fix 1: Protect customer PII in queue_items - create a view for public access
-- Drop the permissive policy that exposes all data
DROP POLICY IF EXISTS "Anyone can view queue" ON public.queue_items;

-- Create policy for admins/barbers to see full queue data
CREATE POLICY "Staff can view full queue data"
ON public.queue_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'barber'::app_role)
);

-- Create policy for public to see only non-sensitive queue data
-- Using a function to mask sensitive data
CREATE OR REPLACE FUNCTION public.get_public_queue()
RETURNS TABLE (
  id uuid,
  ticket_number text,
  status text,
  priority text,
  created_at timestamptz,
  called_at timestamptz,
  service_id uuid,
  barber_id uuid,
  customer_name_masked text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    ticket_number,
    status,
    priority,
    created_at,
    called_at,
    service_id,
    barber_id,
    CASE 
      WHEN length(customer_name) > 2 THEN 
        substring(customer_name, 1, 2) || repeat('*', greatest(length(customer_name) - 2, 0))
      ELSE '**'
    END as customer_name_masked
  FROM public.queue_items
  WHERE status IN ('waiting', 'called', 'in_progress')
  ORDER BY 
    CASE priority WHEN 'preferencial' THEN 0 ELSE 1 END,
    created_at ASC;
$$;

-- Fix 2: Protect barbers table - hide user_id from public
DROP POLICY IF EXISTS "Anyone can view active barbers" ON public.barbers;

-- Create a function to return public barber info without user_id
CREATE OR REPLACE FUNCTION public.get_public_barbers()
RETURNS TABLE (
  id uuid,
  display_name text,
  status text,
  specialty text,
  is_available boolean,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    display_name,
    status,
    specialty,
    is_available,
    avatar_url
  FROM public.barbers
  WHERE is_active = true;
$$;

-- Create policy for authenticated staff to see full barber data
CREATE POLICY "Staff can view all barbers"
ON public.barbers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'barber'::app_role) OR
  user_id = auth.uid()
);