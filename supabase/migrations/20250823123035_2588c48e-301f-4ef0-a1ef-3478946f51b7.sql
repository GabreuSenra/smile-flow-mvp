
-- 1) Limpeza de funções antigas que conflitam com o novo modelo
DROP FUNCTION IF EXISTS public.create_clinic_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.handle_simple_user() CASCADE;

-- 2) Função + Trigger de criação de profile no signup (somente perfis de admin; sem criar clínica)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_role, plan_end_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin',
    (now() + interval '30 days')::date
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recria o trigger (remove se existir) e aponta para a nova função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

-- 3) Corrigir função de papel do usuário (usada em várias RLS)
-- Observação: a coluna correta em profiles é user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  SELECT user_role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- 4) Corrigir função de clínica do usuário
-- Observação: armazenamos auth.uid() em clinic_members.user_id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  SELECT clinic_id
  FROM public.clinic_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$function$;

-- 5) Tabela de assinaturas da Stripe (espelho do status de cada usuário/admin)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Políticas:
-- Usuário pode ver seu próprio registro (por user_id ou email)
DROP POLICY IF EXISTS select_own_subscription ON public.subscribers;
CREATE POLICY select_own_subscription ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Upsert/Update apenas por função (service_role) - as Edge Functions usarão a service key
DROP POLICY IF EXISTS upsert_subscription_service ON public.subscribers;
CREATE POLICY upsert_subscription_service ON public.subscribers
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS update_subscription_service ON public.subscribers;
CREATE POLICY update_subscription_service ON public.subscribers
FOR UPDATE
TO authenticated, anon, service_role
USING (auth.role() = 'service_role');
