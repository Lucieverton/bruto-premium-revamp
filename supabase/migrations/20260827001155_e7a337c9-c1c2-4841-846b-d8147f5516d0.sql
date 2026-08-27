DO $mig$
DECLARE
  r record;
  def text;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosrc ILIKE '%CURRENT_DATE%'
  LOOP
    def := pg_get_functiondef(r.oid);
    def := regexp_replace(def, 'DATE\(created_at\)', '((created_at AT TIME ZONE ''America/Fortaleza'')::date)', 'gi');
    def := regexp_replace(def, '([A-Za-z_][A-Za-z0-9_]*\.)?created_at::date', '((\1created_at AT TIME ZONE ''America/Fortaleza'')::date)', 'g');
    def := regexp_replace(def, 'CURRENT_DATE', '((now() AT TIME ZONE ''America/Fortaleza'')::date)', 'g');
    EXECUTE def;
  END LOOP;
END
$mig$;