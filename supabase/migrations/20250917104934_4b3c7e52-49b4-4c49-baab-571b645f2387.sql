-- Add payment_status column to nyirok_reservations table
ALTER TABLE public.nyirok_reservations 
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid'));