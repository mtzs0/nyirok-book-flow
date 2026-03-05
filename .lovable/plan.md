

## Plan: Pass System Integration into Reservation Flow

### Overview
Integrate the pass system into the reservation flow. Returning users get their passes checked; all users see pass purchase options. Using a pass skips payment; buying a pass changes the payment amount.

### Changes Required

#### 1. Update Service interface and data loading
- Extend `Service` interface with pass fields: `pass_enabled`, `pass_total_treatments`, `pass_paid_treatments`, `pass_expiry_days`, `pass_price_override`
- Add `Pass` interface: `id`, `email`, `service_id`, `total_treatments`, `used_treatments`, `expiry_date`, `status`
- The existing `loadServices()` already does `select('*')` so pass columns will be included automatically

#### 2. New state variables
- `userPasses`: array of active passes fetched for the returning user's email
- `selectedPass`: the pass being used (or null)
- `passPurchaseMode`: boolean -- true if user is buying a new pass instead of a single booking
- `passPrice`: calculated pass price for the selected service (for display and payment)

#### 3. Load passes for returning users
- When a returning user provides their email and continues, query `nyirok_passes` where `email = modifyEmail` AND `status = 'active'` AND `expiry_date > now()`
- Store results in `userPasses` state

#### 4. Modify "Szolgaltatás" step (case 6 in new booking flow)
For each service card, after the existing service info, add:
- **If user has an active pass for this service** (matching `service_id`, `used_treatments < total_treatments`):
  - Green button: "Bérlet igénybevétele"
  - Text: "Jelenleg X alkalmat tud még bérlettel igénybe venni" (X = total_treatments - used_treatments)
  - Clicking sets `selectedPass` and `formData.service`, then the flow continues
- **If user has no pass (or is new user)** and `pass_enabled` is true for the service:
  - Blue button: "X alkalmas bérlet vásárlása" (X = pass_total_treatments)
  - Price shown: if `pass_price_override > 0` use that, else `pass_paid_treatments * service.price`
  - Clicking sets `passPurchaseMode = true` and `formData.service`

Users can still select a service normally (single booking without pass) by clicking the service card itself.

#### 5. Skip payment step when using existing pass
- In `handleNext()`: if `selectedPass` is set and current step is 7 (Adatok), skip step 8 (Foglalás) and jump to step 9 (Összegzés)
- In step 9 summary: if `selectedPass`, show "Bérlet igénybevételével" instead of the price

#### 6. Modify payment step for pass purchase
- In step 8 (Foglalás): if `passPurchaseMode`, show the pass price instead of the normal 300 Ft booking fee
- The 5-click secret bypass should still work for pass purchases
- Modify `handlePayment` to pass a `passPrice` field to the `create-payment` edge function when in pass purchase mode
- Modify `handleSecretPaymentBypass` to handle pass purchase mode

#### 7. Update `create-payment` edge function
- Accept optional `passPrice` in the request body
- When present, use `passPrice` instead of the fixed 300 HUF booking fee
- Update product name/description to indicate it's a pass purchase

#### 8. Save pass data after successful payment/booking

**When buying a new pass (after successful payment):**
- Insert into `nyirok_passes`: email, name, service_id, total_treatments (from service), used_treatments = 1 (first use), purchase_date = now, expiry_date (calculated from pass_expiry_days or year 3000), status = 'active', invoice_id = ''
- Insert into `nyirok_pass_uses`: pass_id, reservation_id, time = now
- This happens in `handleSecretPaymentBypass` and in `verify-payment` edge function

**When using an existing pass:**
- After creating the reservation (in the summary/submit step), increment `used_treatments` on the pass
- If used_treatments equals total_treatments, set status to 'used'  
- Insert into `nyirok_pass_uses`: pass_id, reservation_id, time = now
- Since `nyirok_passes` UPDATE is admin-only via RLS, we need an edge function

#### 9. New edge function: `use-pass`
Accepts: `passId`, `reservationData` (same format as normal booking), `isNewPass` (boolean), `newPassData` (optional, for new pass creation)

Logic:
- Creates the reservation in `nyirok_reservations`
- If `isNewPass`: creates the pass row in `nyirok_passes`, then creates `nyirok_pass_uses` entry
- If existing pass: updates `used_treatments += 1`, updates status to 'used' if equal to total, creates `nyirok_pass_uses` entry
- Uses service role key to bypass RLS
- Returns reservation ID and pass data

#### 10. Update `verify-payment` edge function
- Accept optional `passPurchaseData` in reservationData
- When present, after creating the reservation, also create the pass in `nyirok_passes` and log in `nyirok_pass_uses`

### Files to Create/Modify
1. **`src/components/ReservationSystem.tsx`** -- Major: new state, pass loading, service step UI changes, flow skip logic, summary changes, pass submission logic
2. **`supabase/functions/use-pass/index.ts`** -- New: handles pass usage (both new and existing) with reservation creation
3. **`supabase/functions/create-payment/index.ts`** -- Minor: accept dynamic price for pass purchases
4. **`supabase/functions/verify-payment/index.ts`** -- Minor: handle pass creation after successful pass payment
5. **`supabase/config.toml`** -- Add `use-pass` function config with `verify_jwt = false`

### No database changes needed
All required tables and columns already exist from the previous migration.

