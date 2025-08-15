
-- Create a policy that allows anyone to insert reservations (public access)
CREATE POLICY "Allow public reservation creation" 
  ON public.nyirok_reservations 
  FOR INSERT 
  WITH CHECK (true);

-- Create a policy that allows anyone to view reservations (needed for availability checking)
CREATE POLICY "Allow public reservation viewing" 
  ON public.nyirok_reservations 
  FOR SELECT 
  USING (true);
