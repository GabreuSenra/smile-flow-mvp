-- Create a separate dentist_profiles table for dentist information
CREATE TABLE public.dentist_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dentist_profiles ENABLE ROW LEVEL SECURITY;

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

-- Update dentists table to reference dentist_profiles instead of profiles
ALTER TABLE public.dentists DROP COLUMN profile_id;
ALTER TABLE public.dentists ADD COLUMN dentist_profile_id uuid REFERENCES public.dentist_profiles(id);

-- Add trigger for timestamps on dentist_profiles
CREATE TRIGGER update_dentist_profiles_updated_at
BEFORE UPDATE ON public.dentist_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();