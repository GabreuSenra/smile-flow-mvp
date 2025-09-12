-- Add preferred_dentist_id to appointment_requests table
ALTER TABLE appointment_requests ADD COLUMN preferred_dentist_id uuid;