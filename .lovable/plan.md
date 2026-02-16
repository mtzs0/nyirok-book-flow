
## New Webhook After Successful Payment

### What will happen
A new Edge Function called `notify-payment-webhook` will be created. It will be called from the `verify-payment` function right after a successful payment and reservation creation. It will forward the customer's form data to the new n8n webhook URL.

### Data sent to the webhook
The webhook at `https://n.dakexpo.hu/webhook/243023e8-6813-4046-b71c-c153d4584dcd` will receive:
- Client name
- Client email
- Client phone
- Client post code (iranyitoszam)
- Client city (varos)
- Client street (utca)
- Selected service name
- Selected service price

### Technical details

**1. Create new Edge Function: `supabase/functions/notify-payment-webhook/index.ts`**
- Accepts a POST with the customer and service data
- Forwards it to `https://n.dakexpo.hu/webhook/243023e8-6813-4046-b71c-c153d4584dcd`
- Same structure as the existing `notify-webhook` function

**2. Update `supabase/config.toml`**
- Add `[functions.notify-payment-webhook]` with `verify_jwt = false`

**3. Update `supabase/functions/verify-payment/index.ts`**
- After the reservation is successfully created (line 75), add a call to the new `notify-payment-webhook` Edge Function
- The call will be fire-and-forget (non-blocking) so it doesn't delay the payment response
- It will send a payload with the specific fields listed above, extracted from `reservationData`
- The service price will be pulled from `reservationData.service.price`

### Flow

```text
Payment verified (Stripe) 
  --> Reservation saved to DB 
    --> Existing DB trigger fires notify-webhook (reservation data)
    --> verify-payment calls notify-payment-webhook (customer + service data)
      --> Forwarded to n8n webhook
  --> Response returned to frontend
```
