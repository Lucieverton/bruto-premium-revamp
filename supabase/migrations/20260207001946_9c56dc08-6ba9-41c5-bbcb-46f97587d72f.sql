-- Remove broken triggers that use pg_net (net.http_post) which is not available
-- This fixes the queue insertion error: "schema 'net' does not exist"

DROP TRIGGER IF EXISTS on_queue_item_insert_push ON public.queue_items;
DROP TRIGGER IF EXISTS on_queue_item_transfer_push ON public.queue_items;
DROP FUNCTION IF EXISTS public.notify_barbers_push();
DROP FUNCTION IF EXISTS public.notify_barber_transfer_push();