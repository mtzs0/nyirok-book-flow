import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_URL = 'https://n.dakexpo.hu/webhook-test/243023e8-6813-4046-b71c-c153d4584dcd';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('notify-payment-webhook: Received payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook call failed with status: ${response.status}`);
      // Don't throw - this is non-critical, just log the failure
    } else {
      console.log('notify-payment-webhook: Webhook call successful');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in notify-payment-webhook:', error);
    // Return success anyway - webhook failures shouldn't block the flow
    return new Response(JSON.stringify({ success: true, warning: 'Webhook delivery failed but was non-blocking' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
