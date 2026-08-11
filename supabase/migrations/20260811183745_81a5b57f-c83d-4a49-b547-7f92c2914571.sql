CREATE OR REPLACE FUNCTION public.get_financial_series(
  p_start timestamptz,
  p_end timestamptz,
  p_bucket text DEFAULT 'day',
  p_barber_id uuid DEFAULT NULL
)
RETURNS TABLE(
  bucket_start timestamptz,
  revenue numeric,
  commission numeric,
  shop_profit numeric,
  attendances integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
  v_self uuid;
  v_interval interval;
  v_unit text;
BEGIN
  IF p_bucket NOT IN ('hour','day','month') THEN
    RAISE EXCEPTION 'Bucket inválido. Use hour, day ou month';
  END IF;

  v_is_admin := has_role(auth.uid(), 'admin'::app_role);
  SELECT id INTO v_self FROM barbers WHERE user_id = auth.uid() LIMIT 1;

  IF NOT v_is_admin THEN
    IF v_self IS NULL THEN
      RAISE EXCEPTION 'Não autorizado';
    END IF;
    p_barber_id := v_self;
  END IF;

  v_unit := p_bucket;
  v_interval := ('1 ' || p_bucket)::interval;

  RETURN QUERY
  WITH buckets AS (
    SELECT generate_series(
      date_trunc(v_unit, p_start AT TIME ZONE 'America/Fortaleza'),
      date_trunc(v_unit, p_end AT TIME ZONE 'America/Fortaleza'),
      v_interval
    ) AS b
  ),
  recs AS (
    SELECT
      date_trunc(v_unit, ar.completed_at AT TIME ZONE 'America/Fortaleza') AS b,
      ar.price_charged AS price,
      (ar.price_charged * COALESCE(bb.commission_percentage, 50)) / 100 AS comm
    FROM attendance_records ar
    LEFT JOIN barbers bb ON bb.id = ar.barber_id
    WHERE ar.completed_at >= p_start
      AND ar.completed_at <= p_end
      AND (p_barber_id IS NULL OR ar.barber_id = p_barber_id)
  )
  SELECT
    (bk.b AT TIME ZONE 'America/Fortaleza')::timestamptz,
    COALESCE(SUM(r.price), 0)::numeric,
    COALESCE(SUM(r.comm), 0)::numeric,
    COALESCE(SUM(r.price - r.comm), 0)::numeric,
    COUNT(r.price)::integer
  FROM buckets bk
  LEFT JOIN recs r ON r.b = bk.b
  GROUP BY bk.b
  ORDER BY bk.b;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_financial_by_barber(
  p_start timestamptz,
  p_end timestamptz
)
RETURNS TABLE(
  barber_id uuid,
  barber_name text,
  commission_percentage numeric,
  revenue numeric,
  commission numeric,
  shop_profit numeric,
  attendances integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
  v_self uuid;
BEGIN
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);
  SELECT id INTO v_self FROM barbers WHERE user_id = auth.uid() LIMIT 1;

  IF NOT v_is_admin AND v_self IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.display_name,
    COALESCE(b.commission_percentage, 50)::numeric,
    COALESCE(SUM(ar.price_charged), 0)::numeric,
    COALESCE(SUM((ar.price_charged * COALESCE(b.commission_percentage, 50)) / 100), 0)::numeric,
    COALESCE(SUM(ar.price_charged - (ar.price_charged * COALESCE(b.commission_percentage, 50)) / 100), 0)::numeric,
    COUNT(ar.id)::integer
  FROM barbers b
  LEFT JOIN attendance_records ar
    ON ar.barber_id = b.id
   AND ar.completed_at >= p_start
   AND ar.completed_at <= p_end
  WHERE (v_is_admin OR b.id = v_self)
  GROUP BY b.id, b.display_name, b.commission_percentage
  ORDER BY 4 DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_series(timestamptz, timestamptz, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_by_barber(timestamptz, timestamptz) TO authenticated;