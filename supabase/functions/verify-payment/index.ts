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

    const { sessionId, reservationData } = await req.json();
    
    if (!sessionId || !reservationData) {
      console.error("verify-payment: Missing required data:", { sessionId: !!sessionId, reservationData: !!reservationData });
      throw new Error("Session ID and reservation data are required");
    }

    console.log("verify-payment: Verifying session:", sessionId, "for reservation data");

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
      console.log("verify-payment: Payment confirmed, creating reservation...");
      
      // Generate invoice ID atomically
      const { data: invoiceResult, error: invoiceError } = await supabase.rpc('next_invoice_id');
      if (invoiceError) {
        console.error("verify-payment: Error generating invoice ID:", invoiceError);
        throw new Error(`Failed to generate invoice ID: ${invoiceError.message}`);
      }
      const invoiceId = invoiceResult as string;
      console.log("verify-payment: Generated invoiceId:", invoiceId);

      // Create the reservation now that payment is confirmed
      const reservationPayload = {
        name: reservationData.personalData.fullName,
        email: reservationData.personalData.email,
        phone: reservationData.personalData.phone,
        iranyitoszam: reservationData.personalData.iranyitoszam || null,
        varos: reservationData.personalData.varos || null,
        utca: reservationData.personalData.utca || null,
        birthday: reservationData.personalData.birthday || null,
        therapist_link: reservationData.therapist.id,
        date: reservationData.date,
        time: reservationData.time,
        location: reservationData.location.name,
        therapist: reservationData.therapist.name,
        service: reservationData.service.name,
        notes: `Statements: ${reservationData.statements.join(', ')}`,
        payment_status: 'paid',
        invoiceId: invoiceId
      };

      const { data, error } = await supabase
        .from('nyirok_reservations')
        .insert([reservationPayload])
        .select();

      if (error) {
        console.error("verify-payment: Error creating reservation:", error);
        throw new Error(`Failed to create reservation: ${error.message}`);
      }

      console.log("verify-payment: Reservation created successfully:", data);

      // Fire-and-forget: notify payment webhook with customer + service data
      try {
        const webhookPayload = {
          client_name: reservationData.personalData.fullName,
          client_email: reservationData.personalData.email,
          client_phone: reservationData.personalData.phone,
          client_postcode: reservationData.personalData.iranyitoszam || null,
          client_city: reservationData.personalData.varos || null,
          client_street: reservationData.personalData.utca || null,
          service_name: reservationData.service.name,
          service_price: reservationData.service.price,
        };
        fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-payment-webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        }).catch(err => console.error("verify-payment: notify-payment-webhook fire-and-forget error:", err));
      } catch (e) {
        console.error("verify-payment: Failed to call notify-payment-webhook:", e);
      }

      return new Response(JSON.stringify({
        success: true,
        paymentStatus: 'paid',
        reservationId: data[0].id,
        reservation: data[0]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.log("verify-payment: Payment not completed, status:", session.payment_status);
      
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});