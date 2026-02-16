

## Update Webhook URL to Test Endpoint

### Change
Update the webhook URL in `supabase/functions/notify-payment-webhook/index.ts` from the production path to the test path:

**From:** `https://n.dakexpo.hu/webhook/243023e8-6813-4046-b71c-c153d4584dcd`
**To:** `https://n.dakexpo.hu/webhook-test/243023e8-6813-4046-b71c-c153d4584dcd`

Then redeploy the `notify-payment-webhook` Edge Function.

### Reminder
Once you activate the n8n workflow, the URL will need to be switched back to `/webhook/`.

