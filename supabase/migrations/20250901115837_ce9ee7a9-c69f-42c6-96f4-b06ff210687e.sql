-- Add time_end column to nyirok_services table
ALTER TABLE public.nyirok_services 
ADD COLUMN time_end integer;

-- Update existing services to set time_end = time + 30
UPDATE public.nyirok_services 
SET time_end = time + 30;