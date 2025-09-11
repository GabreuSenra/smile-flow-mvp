-- Fix missing public_code column in clinics table
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS public_code text;