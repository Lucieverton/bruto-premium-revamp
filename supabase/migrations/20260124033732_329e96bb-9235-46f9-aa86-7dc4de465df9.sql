-- Drop the old status check constraint
ALTER TABLE public.queue_items DROP CONSTRAINT queue_items_status_check;

-- Add updated constraint that includes 'called' status
ALTER TABLE public.queue_items 
ADD CONSTRAINT queue_items_status_check 
CHECK (status = ANY (ARRAY['waiting'::text, 'called'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]));