-- Add rank column to nyirok_personnel table
ALTER TABLE public.nyirok_personnel 
ADD COLUMN rank integer NOT NULL DEFAULT 1 CHECK (rank >= 1 AND rank <= 10);

-- Update existing expert therapists to rank 10, others remain at rank 1
UPDATE public.nyirok_personnel 
SET rank = 10 
WHERE expert = true;

-- Update existing non-expert therapists to rank 1 (already default, but being explicit)
UPDATE public.nyirok_personnel 
SET rank = 1 
WHERE expert = false;