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

    const { reservationData, passPrice } = await req.json();
    
    if (!reservationData) {
      throw new Error("Reservation data required");
    }

    console.log("create-payment: Received reservation data:", reservationData, "passPrice:", passPrice);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Use passPrice if provided (pass purchase), otherwise fixed booking fee
    const isPassPurchase = !!passPrice && passPrice > 0;
    const BOOKING_FEE_HUF = isPassPurchase ? passPrice : 5000;
    
    const priceInMinorUnits = BOOKING_FEE_HUF * 100;
    
    console.log("create-payment: Using fee:", { 
      isPassPurchase,
      bookingFeeHuf: BOOKING_FEE_HUF,
      priceInMinorUnits
    });

    const productName = isPassPurchase 
      ? 'Nyirok Klinika bérlet vásárlás' 
      : 'Nyirok Klinika kezelés foglalási díj';
    const productDescription = isPassPurchase
      ? 'Nyirokterápia bérlet'
      : 'Nyirokterápia foglalási díj';

    const sessionData = {
      customer_email: reservationData.personalData.email,
      line_items: [
        {
          price_data: {
            currency: 'huf',
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: priceInMinorUnits,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://mtzs0.github.io/nyirok-book-flow/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://mtzs0.github.io/nyirok-book-flow/payment-cancelled.html`,
      metadata: {
        reservation_date: reservationData.date,
        reservation_time: reservationData.time,
        therapist: reservationData.therapist.name,
        service: reservationData.service.name,
        client_email: reservationData.personalData.email,
      },
    };

    console.log("create-payment: Session data being sent to Stripe:", JSON.stringify(sessionData, null, 2));

    // Create a checkout session with fixed booking fee
    const session = await stripe.checkout.sessions.create(sessionData);

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
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});