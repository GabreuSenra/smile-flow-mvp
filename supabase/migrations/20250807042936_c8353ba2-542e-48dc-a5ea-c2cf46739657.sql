-- Remove the default clinic created earlier
DELETE FROM public.clinic_members;
DELETE FROM public.clinics WHERE name = 'Clínica Dental';

-- Add subscription fields to clinics table if not exists
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days');

-- Create function to handle clinic creation on signup
CREATE OR REPLACE FUNCTION public.create_clinic_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  clinic_id UUID;
BEGIN
  -- Only proceed if this is a new user with clinic data in metadata
  IF TG_OP = 'INSERT' AND NEW.raw_user_meta_data ? 'clinic_name' THEN
    -- Create the clinic
    INSERT INTO public.clinics (name, email, phone, address)
    VALUES (
      NEW.raw_user_meta_data->>'clinic_name',
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'clinic_phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'clinic_address', '')
    )
    RETURNING id INTO clinic_id;
    
    -- Create the profile first
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'admin'::user_role
    );
    
    -- Add user as admin of the clinic
    INSERT INTO public.clinic_members (user_id, clinic_id, role, is_active)
    SELECT p.id, clinic_id, 'admin'::user_role, true
    FROM public.profiles p
    WHERE p.user_id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the existing trigger and create the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created_with_clinic
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_clinic_on_signup();

-- Update the existing simple trigger for users without clinic data
CREATE OR REPLACE FUNCTION public.handle_simple_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
BEGIN
  -- Only create profile if no clinic data (fallback for existing flow)
  IF NOT NEW.raw_user_meta_data ? 'clinic_name' THEN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create additional trigger for simple users
CREATE TRIGGER on_auth_simple_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_simple_user();