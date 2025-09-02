import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Usar service role para atualizar dados no banco
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");

    logStep("Verifying payment session", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Recuperar a sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email 
    });

    // Verificar se o pagamento foi bem-sucedido
    if (session.payment_status !== 'paid') {
      logStep("Payment not completed", { paymentStatus: session.payment_status });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Pagamento não foi completado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verificar se o email da sessão corresponde ao usuário autenticado
    if (session.customer_details?.email !== user.email) {
      logStep("Email mismatch", { 
        sessionEmail: session.customer_details?.email, 
        userEmail: user.email 
      });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Email não corresponde ao usuário" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Recuperar a subscription criada
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    logStep("Subscription retrieved", { 
      subscriptionId: subscription.id,
      status: subscription.status 
    });

    // Determinar o plano baseado no preço
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    
    let planName = "Basic";
    let subscriptionTier = "basic";
    
    if (amount <= 4999) { // R$ 49,99
      planName = "Básico";
      subscriptionTier = "basic";
    } else if (amount <= 9999) { // R$ 99,99
      planName = "Premium";
      subscriptionTier = "premium";
    } else { // R$ 150,00+
      planName = "Enterprise";
      subscriptionTier = "enterprise";
    }

    logStep("Plan determined", { priceId, amount, planName, subscriptionTier });

    // Atualizar o registro do subscriber
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    const { error: upsertError } = await supabaseClient
      .from("subscribers")
      .upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: session.customer,
        subscribed: true,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (upsertError) {
      logStep("Error updating subscriber", { error: upsertError });
      throw new Error("Failed to update subscription status");
    }

    logStep("Subscription updated successfully", { 
      planName, 
      subscriptionTier, 
      subscriptionEnd 
    });

    return new Response(JSON.stringify({
      success: true,
      planName,
      subscriptionTier,
      subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});