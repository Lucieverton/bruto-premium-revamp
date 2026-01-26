-- Add column to allow barbers to add clients directly without admin approval
ALTER TABLE public.barbers 
ADD COLUMN can_add_clients_directly BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.barbers.can_add_clients_directly IS 'When true, this barber can add clients to queue without admin approval';