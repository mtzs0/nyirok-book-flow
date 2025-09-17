import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("verify-payment: Function started");

    const { sessionId, reservationId } = await req.json();
    
    if (!sessionId || !reservationId) {
      throw new Error("Session ID and reservation ID are required");
    }

    console.log("verify-payment: Verifying session:", sessionId, "for reservation:", reservationId);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Initialize Supabase client with service role key for updating data
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("verify-payment: Session status:", session.payment_status);

    if (session.payment_status === 'paid') {
      // Update the reservation status to 'paid'
      const { data, error } = await supabase
        .from('nyirok_reservations')
        .update({ payment_status: 'paid' })
        .eq('id', reservationId)
        .select();

      if (error) {
        console.error("verify-payment: Error updating reservation:", error);
        throw new Error(`Failed to update reservation: ${error.message}`);
      }

      console.log("verify-payment: Reservation updated successfully:", data);

      return new Response(JSON.stringify({ 
        success: true,
        paymentStatus: 'paid',
        reservation: data[0]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false,
        paymentStatus: session.payment_status,
        message: 'Payment not completed'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("verify-payment: Error verifying payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});