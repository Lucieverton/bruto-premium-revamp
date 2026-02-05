-- Remove legacy overloaded function to avoid PostgREST ambiguity (PGRST203)
-- Keep only: barber_complete_service(p_ticket_id uuid, p_price_charged numeric, p_payment_method text DEFAULT NULL, p_services jsonb DEFAULT NULL)
DROP FUNCTION IF EXISTS public.barber_complete_service(uuid, numeric, text);