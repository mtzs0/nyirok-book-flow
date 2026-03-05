

## Add Appointment Rescheduling Flow

### Overview
Add a new initial step (step 0) where users choose between booking a new appointment or modifying an existing one. The modification flow uses a completely different set of steps.

### How It Works

The component will track a `mode` state: `'new'` (default booking) or `'modify'` (rescheduling).

**Step 0 - Mode Selection** (new first step for both flows):
Two large buttons: "Idopontfoglalas" and "Meglevo idopont modositasa"

**New Booking flow** (unchanged, steps shift by 1):
0 -> 1(Nyilatkozat) -> 2(Helyszin) -> 3(Datum) -> 4(Idopont) -> 5(Terapeuta) -> 6(Szolgaltatas) -> 7(Adatok) -> 8(Foglalas) -> 9(Osszegzes)

**Modify flow** (completely different steps):
0 -> 1(Felhasznalo) -> 2(Idopontok) -> 3(Foglalas details) -> 4(Datum) -> 5(Idopont) -> 6(Terapeuta) -> 7(Veglegesittes)

### Technical Details

**New state variables:**
- `mode`: `'new' | 'modify' | null` - tracks which flow the user chose
- `modifyEmail`: string - email entered in Felhasznalo step
- `existingReservations`: array - future reservations found for that email
- `selectedReservation`: object - the reservation the user clicked to modify

**New step definitions:**
- Define `MODIFY_STEPS` array with: Felhasznalo, Idopontok, Foglalas, Datum, Idopont, Terapeuta, Veglegesittes
- When `mode === 'modify'`, use `MODIFY_STEPS` for the progress bar and navigation

**Step 0 - Mode Selection:**
- Two styled buttons, no "Tovabb" needed - clicking a button sets the mode and advances

**Step 1 (modify) - Felhasznalo:**
- Single email input field
- "Tovabb" enabled when email is non-empty

**Step 2 (modify) - Idopontok:**
- On entering this step, query `nyirok_reservations` where `email = modifyEmail` and `date >= today`
- Display results in a scrollable list showing: date / time / therapist / service
- "Tovabb" button is disabled; clicking a reservation selects it and auto-advances

**Step 3 (modify) - Foglalas:**
- Display selected reservation details: Datum, Idopont, Szolgaltatas, Terapeuta, Helyszin
- "Tovabb" button labeled "Foglalas modositasa"

**Steps 4-6 (modify) - Datum, Idopont, Terapeuta:**
- Reuse existing rendering logic for date/time/therapist selection
- Location is pulled from the selected reservation (looked up from `nyirok_locations` by name)
- Expert filtering uses the original reservation's therapist expert status (no Nyilatkozat step in modify flow, so all therapists at that location are shown)
- The `formData.statements` will default to the "none apply" option so `requiresExpert()` returns false, showing all therapists

**Step 7 (modify) - Veglegesittes:**
- Shows old vs new details (date, time, therapist)
- "Veglegesittes" button updates the existing `nyirok_reservations` row (by reservation id) setting new `date`, `time`, `therapist`, and `therapist_link` columns

**RLS consideration:**
- The `nyirok_reservations` table currently only allows admin to UPDATE. We need a new RLS policy to allow public updates on specific columns, restricted by matching the reservation id. Since anonymous users need to update, we will add a permissive UPDATE policy that allows updating `date`, `time`, `therapist`, and `therapist_link` columns.
- Actually, RLS policies cannot restrict by column in Postgres. Instead, we will use the service role via an Edge Function to perform the update securely, OR we add a simple permissive RLS policy for UPDATE. Given the current architecture (no auth for public users), the safest approach is to create a small Edge Function `update-reservation` that accepts reservation ID + new date/time/therapist data and performs the update using the service role key.

### Database Changes
- Create a new Edge Function `update-reservation` that:
  - Accepts: `reservationId`, `date`, `time`, `therapist` (name), `therapist_link` (UUID)
  - Updates the matching row in `nyirok_reservations` using the service role
  - Returns success/failure

### Files to Modify
1. **`src/components/ReservationSystem.tsx`** - Major changes: add mode selection step, modify flow state, new step renderers, modify-specific navigation logic
2. **`supabase/functions/update-reservation/index.ts`** - New Edge Function for secure reservation updates

### No database migration needed
The existing `nyirok_reservations` table already has all required columns. We just need the Edge Function to bypass RLS for the update.

