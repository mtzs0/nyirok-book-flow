import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { passId, reservationData, isNewPass, newPassData } = await req.json();

    if (!reservationData) {
      throw new Error("Reservation data required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate invoice ID
    const { data: invoiceId, error: invoiceError } = await supabase.rpc('next_invoice_id');
    if (invoiceError) throw new Error(`Failed to generate invoice ID: ${invoiceError.message}`);

    // Create the reservation
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
      invoiceId: invoiceId as string,
    };

    const { data: resData, error: resError } = await supabase
      .from('nyirok_reservations')
      .insert([reservationPayload])
      .select();

    if (resError) throw new Error(`Failed to create reservation: ${resError.message}`);

    const reservationId = resData[0].id;

    if (isNewPass && newPassData) {
      // Create a new pass
      const passPayload = {
        email: newPassData.email,
        name: newPassData.name,
        service_id: newPassData.service_id,
        total_treatments: newPassData.total_treatments,
        used_treatments: 1, // first use
        purchase_date: new Date().toISOString(),
        expiry_date: newPassData.expiry_date,
        status: newPassData.total_treatments <= 1 ? 'used' : 'active',
        invoice_id: newPassData.invoice_id || null,
      };

      const { data: passData, error: passError } = await supabase
        .from('nyirok_passes')
        .insert([passPayload])
        .select();

      if (passError) throw new Error(`Failed to create pass: ${passError.message}`);

      // Log pass use
      await supabase.from('nyirok_pass_uses').insert([{
        pass_id: passData[0].id,
        reservation_id: reservationId,
      }]);

      // Fire-and-forget webhook
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-payment-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: newPassData.name,
          client_email: newPassData.email,
          client_phone: reservationData.personalData.phone,
          client_postcode: reservationData.personalData.iranyitoszam || null,
          client_city: reservationData.personalData.varos || null,
          client_street: reservationData.personalData.utca || null,
          service_name: reservationData.service.name,
          service_price: reservationData.service.price,
          invoiceId: invoiceId as string,
        }),
      }).catch(err => console.error("notify-payment-webhook error:", err));

      return new Response(JSON.stringify({
        success: true,
        reservationId,
        passId: passData[0].id,
        reservation: resData[0],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (passId) {
      // Use existing pass - increment used_treatments
      const { data: passData, error: fetchError } = await supabase
        .from('nyirok_passes')
        .select('*')
        .eq('id', passId)
        .single();

      if (fetchError) throw new Error(`Failed to fetch pass: ${fetchError.message}`);

      const newUsed = passData.used_treatments + 1;
      const newStatus = newUsed >= passData.total_treatments ? 'used' : 'active';

      const { error: updateError } = await supabase
        .from('nyirok_passes')
        .update({ used_treatments: newUsed, status: newStatus })
        .eq('id', passId);

      if (updateError) throw new Error(`Failed to update pass: ${updateError.message}`);

      // Log pass use
      await supabase.from('nyirok_pass_uses').insert([{
        pass_id: passId,
        reservation_id: reservationId,
      }]);

      // Fire-and-forget webhook
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-payment-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: reservationData.personalData.fullName,
          client_email: reservationData.personalData.email,
          client_phone: reservationData.personalData.phone,
          client_postcode: reservationData.personalData.iranyitoszam || null,
          client_city: reservationData.personalData.varos || null,
          client_street: reservationData.personalData.utca || null,
          service_name: reservationData.service.name,
          service_price: reservationData.service.price,
          invoiceId: invoiceId as string,
        }),
      }).catch(err => console.error("notify-payment-webhook error:", err));

      return new Response(JSON.stringify({
        success: true,
        reservationId,
        passId,
        passStatus: newStatus,
        reservation: resData[0],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fallback - no pass involved (shouldn't happen but handle gracefully)
    return new Response(JSON.stringify({
      success: true,
      reservationId,
      reservation: resData[0],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("use-pass error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
