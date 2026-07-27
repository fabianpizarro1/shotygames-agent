import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id, clientTransactionId } = await req.json();
    
    console.log('Confirming PayPhone transaction:', { id, clientTransactionId });

    const payphoneToken = Deno.env.get('PAYPHONE_TOKEN');
    
    if (!payphoneToken) {
      console.error('PAYPHONE_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'PayPhone token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call PayPhone Confirm API
    const response = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${payphoneToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: parseInt(id),
        clientTxId: clientTransactionId,
      }),
    });

    const data = await response.json();
    
    console.log('PayPhone confirmation response:', data);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Error confirming transaction', errorCode: data.errorCode }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in payphone-confirm:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
