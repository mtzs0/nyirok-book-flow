-- Add rank_name column to nyirok_personnel table
ALTER TABLE public.nyirok_personnel 
ADD COLUMN rank_name TEXT CHECK (rank_name IN ('Masszőr', 'Nyirok terapeuta', 'Rehabilitációs nyirok terapeuta'));