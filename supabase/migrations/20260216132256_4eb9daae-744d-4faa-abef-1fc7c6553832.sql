
-- Add invoiceId column
ALTER TABLE public.nyirok_reservations ADD COLUMN "invoiceId" text NULL;

-- Create a counter table for yearly invoice numbering
CREATE TABLE public.nyirok_invoice_counters (
  year integer PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0
);

-- Enable RLS (admin only)
ALTER TABLE public.nyirok_invoice_counters ENABLE ROW LEVEL SECURITY;

-- Function to get next invoice ID atomically
CREATE OR REPLACE FUNCTION public.next_invoice_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_year integer := EXTRACT(YEAR FROM now());
  next_num integer;
BEGIN
  INSERT INTO nyirok_invoice_counters (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_number = nyirok_invoice_counters.last_number + 1
  RETURNING last_number INTO next_num;
  
  RETURN 'NYIROK-' || current_year || '-' || next_num;
END;
$$;
