
-- Fix search_path on trigger functions for security
ALTER FUNCTION public.notify_barbers_push() SET search_path = public;
ALTER FUNCTION public.notify_barber_transfer_push() SET search_path = public;
