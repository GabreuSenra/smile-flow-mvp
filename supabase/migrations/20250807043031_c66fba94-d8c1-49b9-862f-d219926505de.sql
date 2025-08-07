-- Create subscriptions table to track clinic subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_name TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Clinic admins can view subscription" 
ON public.subscriptions 
FOR SELECT 
USING (
  clinic_id = get_user_clinic_id() AND 
  get_user_role() = 'admin'::user_role
);

CREATE POLICY "Service can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (true);

-- Create trigger for updating subscriptions timestamp
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for clinic creation by admins
CREATE POLICY "Admins can create clinics during signup" 
ON public.clinics 
FOR INSERT 
WITH CHECK (true);

-- Update clinic_members policies to allow admin creation
CREATE POLICY "Service can create clinic members" 
ON public.clinic_members 
FOR INSERT 
WITH CHECK (true);