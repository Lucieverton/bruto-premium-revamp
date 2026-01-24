-- Fix the overly permissive INSERT policy on audit_logs
-- Drop the existing policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a more restrictive policy that allows authenticated users to insert their own audit logs
-- or service role (edge functions) to insert any logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  -- Allow if the actor_id matches the current user
  actor_id = auth.uid()
  -- Or if there's no authenticated user (service role context from edge functions)
  OR auth.uid() IS NULL
);