import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PATIENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role to bypass RLS for secure patient creation
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Resolve clinic_id for current user (via profiles -> clinic_members)
    const { data: profile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileLookupError) throw profileLookupError;

    const { data: membership, error: membershipError } = await supabase
      .from('clinic_members')
      .select('clinic_id')
      .eq('user_id', profile?.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.clinic_id) {
      throw new Error('Usuário não está associado a uma clínica');
    }

    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      cpf,
      date_of_birth,
      address,
      emergency_contact,
      emergency_phone,
      allergies,
      medical_conditions,
    } = body ?? {};

    if (!full_name || !email) {
      throw new Error('Nome completo e email são obrigatórios');
    }

    // Create patient profile with a random UUID (non-auth user)
    const dummyUserId = crypto.randomUUID();

    let newProfile;
    {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: dummyUserId,
          full_name,
          email,
          phone: phone || null,
          role: 'patient',
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate email gracefully
        // @ts-ignore - PostgrestError has code
        if ((error as any).code === '23505') {
          logStep('Profile exists, reusing', { email });
          const { data: existing, error: fetchExistingErr } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();
          if (fetchExistingErr || !existing) throw (fetchExistingErr || new Error('Perfil já existe mas não pôde ser recuperado'));
          // @ts-ignore
          newProfile = existing;
        } else {
          throw error;
        }
      } else {
        // @ts-ignore
        newProfile = data;
      }
    }

    const { data: patient, error: insertPatientError } = await supabase
      .from('patients')
      .insert({
        profile_id: newProfile.id,
        clinic_id: membership.clinic_id,
        cpf: cpf || null,
        date_of_birth: date_of_birth || null,
        address: address || null,
        emergency_contact: emergency_contact || null,
        emergency_phone: emergency_phone || null,
        allergies: allergies || null,
        medical_conditions: medical_conditions || null,
      })
      .select()
      .single();

    if (insertPatientError) throw insertPatientError;

    logStep('Patient created', { profile_id: newProfile.id, patient_id: patient.id });

    return new Response(JSON.stringify({
      success: true,
      profile_id: newProfile.id,
      patient_id: patient.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const err = error as any;
    const message = err?.message || JSON.stringify(err);
    logStep('ERROR', { message });
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
