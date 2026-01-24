-- RLS policies para barbeiros logados acessarem dados limitados

-- Barbeiros podem ver seu próprio registro
CREATE POLICY "Barbers can view own record"
ON public.barbers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Barbeiros podem atualizar sua própria disponibilidade
CREATE POLICY "Barbers can update own availability"
ON public.barbers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Barbeiros podem atualizar itens da fila atribuídos a eles
CREATE POLICY "Barbers can update assigned queue items"
ON public.queue_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbers 
    WHERE barbers.user_id = auth.uid() 
    AND barbers.id = queue_items.barber_id
  )
);

-- Barbeiros podem inserir registros de atendimento para itens atribuídos a eles
CREATE POLICY "Barbers can insert own attendance"
ON public.attendance_records FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbers 
    WHERE barbers.user_id = auth.uid() 
    AND barbers.id = attendance_records.barber_id
  )
);

-- Barbeiros podem ver seus próprios registros de atendimento
CREATE POLICY "Barbers can view own attendance"
ON public.attendance_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbers 
    WHERE barbers.user_id = auth.uid() 
    AND barbers.id = attendance_records.barber_id
  )
);