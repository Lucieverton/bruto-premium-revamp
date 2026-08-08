ALTER TABLE public.barbers DROP CONSTRAINT IF EXISTS barbers_status_check;
UPDATE public.barbers SET status = 'paused' WHERE status = 'away';
ALTER TABLE public.barbers ADD CONSTRAINT barbers_status_check CHECK (status = ANY (ARRAY['online'::text,'busy'::text,'paused'::text,'offline'::text]));

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='barber_breaks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.barber_breaks;
  END IF;
END
$do$;

DROP FUNCTION IF EXISTS public.get_barber_breaks(timestamptz, timestamptz, uuid);

CREATE OR REPLACE FUNCTION public.get_barber_breaks(p_start timestamptz, p_end timestamptz, p_barber_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  barber_id uuid,
  barber_name text,
  reason text,
  note text,
  state text,
  expected_return timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes integer,
  is_overrun boolean,
  overrun_minutes integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    bb.id,
    bb.barber_id,
    b.display_name,
    bb.reason,
    bb.note,
    bb.state,
    bb.expected_return,
    bb.started_at,
    bb.ended_at,
    GREATEST(0, (EXTRACT(EPOCH FROM (COALESCE(bb.ended_at, now()) - bb.started_at)) / 60)::int) AS duration_minutes,
    CASE
      WHEN bb.expected_return IS NOT NULL THEN COALESCE(bb.ended_at, now()) > bb.expected_return
      ELSE (EXTRACT(EPOCH FROM (COALESCE(bb.ended_at, now()) - bb.started_at)) / 60) > 30
    END AS is_overrun,
    CASE
      WHEN bb.expected_return IS NOT NULL
        THEN GREATEST(0, (EXTRACT(EPOCH FROM (COALESCE(bb.ended_at, now()) - bb.expected_return)) / 60)::int)
      ELSE GREATEST(0, ((EXTRACT(EPOCH FROM (COALESCE(bb.ended_at, now()) - bb.started_at)) / 60) - 30)::int)
    END AS overrun_minutes
  FROM barber_breaks bb
  JOIN barbers b ON b.id = bb.barber_id
  WHERE bb.started_at >= p_start
    AND bb.started_at <= p_end
    AND (p_barber_id IS NULL OR bb.barber_id = p_barber_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR bb.barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
    )
  ORDER BY bb.started_at DESC;
$$;