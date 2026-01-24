-- Add commission_percentage column to barbers table
ALTER TABLE public.barbers 
ADD COLUMN commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00;

-- Add status column to barbers for online/away/offline tracking
ALTER TABLE public.barbers 
ADD COLUMN status TEXT NOT NULL DEFAULT 'offline' 
CHECK (status IN ('online', 'away', 'offline'));

-- Comment for clarity
COMMENT ON COLUMN public.barbers.commission_percentage IS 'Percentage of service price that goes to the barber';
COMMENT ON COLUMN public.barbers.status IS 'Barber current status: online, away, offline';