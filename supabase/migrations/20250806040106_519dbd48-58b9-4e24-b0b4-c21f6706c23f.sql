-- Add clinic_id to patients and appointments inserts
-- Enable RLS policies for INSERT operations

-- Allow staff to insert appointments
CREATE POLICY "Staff can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  clinic_id = get_user_clinic_id() AND 
  get_user_role() = ANY (ARRAY['admin'::user_role, 'dentist'::user_role])
);

-- Allow staff to insert patients 
CREATE POLICY "Staff can create patients" 
ON public.patients 
FOR INSERT 
WITH CHECK (
  clinic_id = get_user_clinic_id() AND 
  get_user_role() = ANY (ARRAY['admin'::user_role, 'dentist'::user_role])
);

-- Allow staff to update appointments
CREATE POLICY "Staff can update appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  clinic_id = get_user_clinic_id() AND 
  get_user_role() = ANY (ARRAY['admin'::user_role, 'dentist'::user_role])
);

-- Allow staff to update patients
CREATE POLICY "Staff can update patients" 
ON public.patients 
FOR UPDATE 
USING (
  clinic_id = get_user_clinic_id() AND 
  get_user_role() = ANY (ARRAY['admin'::user_role, 'dentist'::user_role])
);