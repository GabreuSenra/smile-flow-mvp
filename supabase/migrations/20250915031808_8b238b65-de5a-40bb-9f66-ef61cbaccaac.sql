-- Fix treatment_types RLS policies to allow public viewing and clinic management

-- Drop existing policies
DROP POLICY IF EXISTS "anyone_can_view_treatments" ON treatment_types;
DROP POLICY IF EXISTS "clinics_can_manage_own_treatments" ON treatment_types;

-- Create new policies that work correctly
-- Allow anyone to view treatment types for public booking
CREATE POLICY "public_can_view_treatments" 
ON treatment_types 
FOR SELECT 
USING (true);

-- Allow clinic members to manage their own treatment types
CREATE POLICY "clinic_members_can_manage_treatments" 
ON treatment_types 
FOR ALL 
USING (clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()));

-- Allow clinic members to insert treatment types for their clinic
CREATE POLICY "clinic_members_can_insert_treatments" 
ON treatment_types 
FOR INSERT 
WITH CHECK (clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()));