-- Drop the policy that depends on profile_id
DROP POLICY IF EXISTS "Dentists can update own info" ON public.dentists;

-- Drop the profile_id column from dentists table
ALTER TABLE public.dentists DROP COLUMN IF EXISTS profile_id;

-- Create a separate dentist_profiles table for dentist information
CREATE TABLE IF NOT EXISTS public.dentist_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dentist_profiles ENABLE ROW LEVEL SECURITY;

-- Add dentist_profile_id to dentists table
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS dentist_profile_id uuid REFERENCES public.dentist_profiles(id);

-- Create policies for dentist_profiles
CREATE POLICY "Clinic members can view dentist profiles" 
ON public.dentist_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Clinic members can insert dentist profiles" 
ON public.dentist_profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Clinic members can update dentist profiles" 
ON public.dentist_profiles 
FOR UPDATE 
USING (true);

-- Create policy for dentists to manage their own profile
CREATE POLICY "Clinic members can manage dentists" 
ON public.dentists 
FOR ALL
USING (clinic_id = get_user_clinic_id());

-- Add trigger for timestamps on dentist_profiles
CREATE TRIGGER update_dentist_profiles_updated_at
BEFORE UPDATE ON public.dentist_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();