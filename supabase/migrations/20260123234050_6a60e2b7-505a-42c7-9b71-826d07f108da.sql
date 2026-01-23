-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'barber', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create barbers table
CREATE TABLE public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    specialty TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Create services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create queue_items table
CREATE TABLE public.queue_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    ticket_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'canceled', 'no_show')),
    origin TEXT NOT NULL DEFAULT 'online' CHECK (origin IN ('online', 'presencial')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'preferencial')),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    is_called BOOLEAN NOT NULL DEFAULT false,
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;

-- Enable realtime for queue_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_items;

-- Create queue_settings table
CREATE TABLE public.queue_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_queue_size INTEGER NOT NULL DEFAULT 50,
    opening_time TEXT NOT NULL DEFAULT '09:00',
    closing_time TEXT NOT NULL DEFAULT '19:00',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.queue_settings ENABLE ROW LEVEL SECURITY;

-- Create attendance_records table
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_item_id UUID REFERENCES public.queue_items(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    price_charged NUMERIC(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('dinheiro', 'pix', 'cartao', 'pendente')),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- user_roles: Only admins can view/modify
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- barbers: Public read, admin write
CREATE POLICY "Anyone can view active barbers"
ON public.barbers FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage barbers"
ON public.barbers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- services: Public read, admin write
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- queue_items: Public read, public insert, admin manage
CREATE POLICY "Anyone can view queue"
ON public.queue_items FOR SELECT
USING (true);

CREATE POLICY "Anyone can join queue"
ON public.queue_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update their own ticket"
ON public.queue_items FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete queue items"
ON public.queue_items FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- queue_settings: Public read, admin write
CREATE POLICY "Anyone can view queue settings"
ON public.queue_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.queue_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- attendance_records: Admin only
CREATE POLICY "Admins can view attendance"
ON public.attendance_records FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage attendance"
ON public.attendance_records FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert initial barbers
INSERT INTO public.barbers (display_name, specialty, is_available, is_active) VALUES
('Lucas', 'Cortes Modernos', true, true),
('DG', 'Barba e Degradê', true, true);

-- Insert initial services based on existing price table
INSERT INTO public.services (name, duration_minutes, price) VALUES
('Navalhado + Barba', 35, 50.00),
('Barba Completa', 15, 20.00),
('Corte Social', 20, 25.00),
('Corte + Barba', 35, 40.00),
('Corte Tesoura', 25, 30.00),
('Corte Infantil (até 10 anos)', 20, 20.00),
('Corte Máquina', 15, 20.00),
('Máquina + Pezinho', 20, 25.00),
('Degradê', 25, 30.00),
('Degradê Navalhado', 30, 35.00),
('Degradê + Barba', 40, 45.00),
('Degradê Navalhado + Barba', 45, 55.00),
('Sobrancelha', 10, 10.00),
('Pezinho', 10, 10.00),
('Relaxamento', 60, 80.00),
('Platinado', 90, 120.00),
('Luzes', 90, 100.00),
('Nevou', 60, 80.00),
('Pigmento para Barba', 30, 50.00),
('Limpeza de Pele', 45, 60.00),
('Hidratação', 30, 40.00),
('Selagem', 60, 100.00),
('Combo Pai e Filho', 40, 40.00),
('Desenho Simples', 15, 15.00),
('Desenho Complexo', 30, 30.00),
('Dia de Noivo', 60, 150.00);

-- Insert default queue settings
INSERT INTO public.queue_settings (is_active, max_queue_size, opening_time, closing_time) VALUES
(true, 50, '09:00', '19:00');

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_count INTEGER;
    prefix TEXT;
BEGIN
    -- Count tickets created today
    SELECT COUNT(*) + 1 INTO today_count
    FROM public.queue_items
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Set prefix based on priority
    IF NEW.priority = 'preferencial' THEN
        prefix := 'P';
    ELSE
        prefix := 'A';
    END IF;
    
    -- Generate ticket number
    NEW.ticket_number := prefix || '-' || LPAD(today_count::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$;

-- Trigger to auto-generate ticket number
CREATE TRIGGER generate_ticket_before_insert
BEFORE INSERT ON public.queue_items
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number();