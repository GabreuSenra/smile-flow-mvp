import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's clinic
    const { data: clinicMember } = await supabaseClient
      .from('clinic_members')
      .select('clinic_id')
      .eq('user_id', (await supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      ).data?.id)
      .single();

    if (!clinicMember?.clinic_id) {
      logStep("No clinic found for user");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: null,
        trial_active: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // Check if clinic is still in trial
      const { data: clinic } = await supabaseClient
        .from('clinics')
        .select('trial_end_date')
        .eq('id', clinicMember.clinic_id)
        .single();

      const trialActive = clinic?.trial_end_date ? new Date(clinic.trial_end_date) > new Date() : false;
      
      await supabaseClient.from("subscriptions").upsert({
        clinic_id: clinicMember.clinic_id,
        status: trialActive ? 'trialing' : 'inactive',
        plan_name: 'basic',
        trial_end: clinic?.trial_end_date,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id' });

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: trialActive ? 'trial' : null,
        trial_active: trialActive,
        trial_end: clinic?.trial_end_date
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      const amount = subscription.items.data[0].price.unit_amount || 0;
      if (amount <= 5000) {
        subscriptionTier = "basic";
      } else if (amount <= 10000) {
        subscriptionTier = "premium";
      } else {
        subscriptionTier = "enterprise";
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, tier: subscriptionTier });

      // Update subscription in database
      await supabaseClient.from("subscriptions").upsert({
        clinic_id: clinicMember.clinic_id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan_name: subscriptionTier,
        status: 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id' });
    } else {
      logStep("No active subscription found");
      
      await supabaseClient.from("subscriptions").upsert({
        clinic_id: clinicMember.clinic_id,
        stripe_customer_id: customerId,
        status: 'inactive',
        plan_name: 'basic',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id' });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      trial_active: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});