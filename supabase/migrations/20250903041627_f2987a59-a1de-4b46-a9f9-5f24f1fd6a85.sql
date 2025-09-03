-- First enable realtime for appointment_requests table
ALTER TABLE public.appointment_requests REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.appointment_requests;

-- Create clinic_settings table for blocking days and hours
CREATE TABLE public.clinic_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for clinic_settings
CREATE POLICY "Clinic members can view their settings" 
ON public.clinic_settings 
FOR SELECT 
USING (clinic_id IN (
  SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
));

CREATE POLICY "Clinic members can insert their settings" 
ON public.clinic_settings 
FOR INSERT 
WITH CHECK (clinic_id IN (
  SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
));

CREATE POLICY "Clinic members can update their settings" 
ON public.clinic_settings 
FOR UPDATE 
USING (clinic_id IN (
  SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
));

CREATE POLICY "Clinic members can delete their settings" 
ON public.clinic_settings 
FOR DELETE 
USING (clinic_id IN (
  SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();