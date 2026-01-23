-- Fix RLS policies for queue_items to be more restrictive
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can join queue" ON public.queue_items;
DROP POLICY IF EXISTS "Anyone can update their own ticket" ON public.queue_items;

-- Create function to check queue item ownership via localStorage ID
CREATE OR REPLACE FUNCTION public.get_client_ticket_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.client_ticket_id', true)
$$;

-- More restrictive INSERT policy - still public but with validation
CREATE POLICY "Anyone can join queue with valid data"
ON public.queue_items FOR INSERT
WITH CHECK (
  customer_name IS NOT NULL 
  AND customer_phone IS NOT NULL 
  AND LENGTH(customer_name) >= 2
  AND LENGTH(customer_phone) >= 10
);

-- UPDATE policy - only admins can update queue items
CREATE POLICY "Admins can update queue items"
ON public.queue_items FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));