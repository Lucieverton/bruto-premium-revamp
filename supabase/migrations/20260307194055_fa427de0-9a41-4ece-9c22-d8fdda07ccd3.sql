
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS group_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS companion_name text DEFAULT NULL;
