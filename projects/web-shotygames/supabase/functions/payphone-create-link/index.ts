import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('PAYPHONE_TOKEN');
    const storeId = Deno.env.get('PAYPHONE_STORE_ID');
    
    if (!token || !storeId) {
      console.error('PayPhone credentials not configured - token:', !!token, 'storeId:', !!storeId);
      return new Response(
        JSON.stringify({ error: 'PayPhone not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, clientTransactionId, reference } = await req.json();
    
    console.log('Creating PayPhone link:', { amount, clientTransactionId, reference, storeId });

    // Amount debe estar en centavos
    const amountInCents = Math.round(amount * 100);

    const requestBody = {
      amount: amountInCents,
      amountWithoutTax: amountInCents,
      clientTransactionId: clientTransactionId,
      currency: 'USD',
      storeId: storeId,
      reference: reference || 'Pago ShotyGames'
    };

    console.log('PayPhone request body:', JSON.stringify(requestBody));

    const payphoneResponse = await fetch('https://pay.payphonetodoesposible.com/api/Links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await payphoneResponse.text();
    console.log('PayPhone API response status:', payphoneResponse.status);
    console.log('PayPhone API response:', responseText);

    if (!payphoneResponse.ok) {
      console.error('PayPhone API error:', responseText);
      return new Response(
        JSON.stringify({ error: 'Error creating payment link', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payphoneData = JSON.parse(responseText);
    console.log('PayPhone link created successfully:', payphoneData);

    return new Response(
      JSON.stringify(payphoneData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in payphone-create-link:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
