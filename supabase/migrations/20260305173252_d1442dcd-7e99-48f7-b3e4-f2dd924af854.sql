-- 1. Add pass columns to nyirok_services
ALTER TABLE public.nyirok_services
  ADD COLUMN pass_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN pass_total_treatments integer NOT NULL DEFAULT 10,
  ADD COLUMN pass_paid_treatments integer NOT NULL DEFAULT 9,
  ADD COLUMN pass_expiry_days integer NOT NULL DEFAULT 0,
  ADD COLUMN pass_price_override integer NOT NULL DEFAULT 0;

-- 2. Create nyirok_passes table
CREATE TABLE public.nyirok_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  service_id uuid NOT NULL REFERENCES public.nyirok_services(id),
  total_treatments integer NOT NULL,
  used_treatments integer NOT NULL DEFAULT 0,
  purchase_date timestamptz NOT NULL DEFAULT now(),
  expiry_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  invoice_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nyirok_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passes are publicly readable" ON public.nyirok_passes FOR SELECT USING (true);
CREATE POLICY "Public can create passes" ON public.nyirok_passes FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admin can update passes" ON public.nyirok_passes FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admin can delete passes" ON public.nyirok_passes FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_nyirok_passes_updated_at
  BEFORE UPDATE ON public.nyirok_passes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create nyirok_pass_uses table
CREATE TABLE public.nyirok_pass_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id uuid NOT NULL REFERENCES public.nyirok_passes(id),
  reservation_id uuid NOT NULL REFERENCES public.nyirok_reservations(id),
  time timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nyirok_pass_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pass uses are publicly readable" ON public.nyirok_pass_uses FOR SELECT USING (true);
CREATE POLICY "Public can create pass uses" ON public.nyirok_pass_uses FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admin can delete pass uses" ON public.nyirok_pass_uses FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));