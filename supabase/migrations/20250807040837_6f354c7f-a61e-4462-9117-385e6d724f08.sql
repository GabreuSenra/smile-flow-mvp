-- Create a default clinic for existing users
INSERT INTO public.clinics (name, address, email, phone, subscription_plan, max_patients, max_dentists)
VALUES (
  'Clínica Dental',
  'Endereço da clínica',
  'contato@clinicadental.com',
  '(11) 99999-9999',
  'basic',
  100,
  2
);

-- Get the clinic ID we just created
WITH new_clinic AS (
  SELECT id FROM public.clinics WHERE name = 'Clínica Dental' LIMIT 1
)
-- Associate all existing profiles with the default clinic as admins
INSERT INTO public.clinic_members (user_id, clinic_id, role, is_active)
SELECT p.id, nc.id, 'admin'::user_role, true
FROM public.profiles p
CROSS JOIN new_clinic nc
WHERE NOT EXISTS (
  SELECT 1 FROM public.clinic_members cm 
  WHERE cm.user_id = p.id
);