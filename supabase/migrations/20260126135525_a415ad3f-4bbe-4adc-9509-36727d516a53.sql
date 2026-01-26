-- Remove the permissive public INSERT policy on queue_items
-- All public insertions should go through the secure join_queue RPC function
-- which provides validation, sanitization, and duplicate checking

DROP POLICY IF EXISTS "Anyone can join queue with valid data" ON public.queue_items;