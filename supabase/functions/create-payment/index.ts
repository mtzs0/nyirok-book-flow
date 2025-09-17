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
    console.log("create-payment: Function started");

    const { reservationData } = await req.json();
    
    if (!reservationData || !reservationData.service) {
      throw new Error("Reservation data and service information required");
    }

    console.log("create-payment: Received reservation data:", reservationData);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create a checkout session with dynamic pricing based on the service
    const session = await stripe.checkout.sessions.create({
      customer_email: reservationData.personalData.email,
      line_items: [
        {
          price_data: {
            currency: 'huf',
            product_data: {
              name: `Nyirok Therapy - ${reservationData.service.name}`,
              description: reservationData.service.description || 'Lymphatic therapy reservation',
            },
            unit_amount: reservationData.service.price, // Price should be in minor units (cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}?payment=cancelled`,
      metadata: {
        reservation_date: reservationData.date,
        reservation_time: reservationData.time,
        therapist: reservationData.therapist.name,
        service: reservationData.service.name,
        client_email: reservationData.personalData.email,
      },
    });

    console.log("create-payment: Checkout session created:", session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-payment: Error creating payment session:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});