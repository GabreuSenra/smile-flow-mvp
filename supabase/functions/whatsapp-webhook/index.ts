import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WHATSAPP] ${step}${detailsStr}`);
};

serve(async (req) => {
  const url = new URL(req.url);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || '';
  const WABA_TOKEN = Deno.env.get('META_WABA_TOKEN') || '';
  const PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID') || '';

  try {
    if (req.method === 'GET') {
      // Webhook verification
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        logStep('Webhook verified');
        return new Response(challenge ?? '', { status: 200, headers: corsHeaders });
      }
      logStep('Webhook verification failed');
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    if (req.method === 'POST') {
      if (!WABA_TOKEN || !PHONE_NUMBER_ID) {
        logStep('Missing Meta secrets');
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const body = await req.json();
      logStep('Incoming payload', body);

      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      const from = message?.from; // WhatsApp user phone
      const text = message?.text?.body?.trim() || '';

      if (from && text) {
        // Simple intent handling
        let reply = 'Olá! Para se cadastrar, envie: CADASTRAR Nome;Email. Para agendar: AGENDAR AAAA-MM-DD HH:MM.';

        const upper = text.toUpperCase();
        if (upper.startsWith('CADASTRAR')) {
          reply = 'Recebi seu pedido de cadastro. Em breve confirmaremos!';
        } else if (upper.startsWith('AGENDAR')) {
          reply = 'Recebi seu pedido de agendamento. Verificando disponibilidade...';
        }

        // Send message back via WhatsApp Cloud API
        const graphUrl = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;
        const res = await fetch(graphUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WABA_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: from,
            type: 'text',
            text: { body: reply },
          }),
        });
        const out = await res.text();
        logStep('Sent reply', { status: res.status, body: out });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: msg });
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
